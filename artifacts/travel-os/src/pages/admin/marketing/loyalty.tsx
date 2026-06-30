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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Star, Plus, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

type LoyaltyTxn = {
  id: string; customerName: string; type: string; points: number;
  reason?: string; date: string; createdAt: string;
};

const BLANK = { customerName: "", type: "earn", points: "", reason: "", date: new Date().toISOString().slice(0, 10) };

function LoyaltyForm({ onSave, onCancel }: { onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string, any>>({ ...BLANK });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Customer Name *</Label>
          <Input value={form.customerName} onChange={set("customerName")} placeholder="John Doe" />
        </div>
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="earn">Earn</SelectItem>
              <SelectItem value="redeem">Redeem</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Points *</Label>
          <Input type="number" value={form.points} onChange={set("points")} placeholder="100" min="0" />
        </div>
        <div className="space-y-1.5">
          <Label>Date *</Label>
          <Input type="date" value={form.date} onChange={set("date")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Reason</Label>
          <Input value={form.reason} onChange={set("reason")} placeholder="Booking reward, redemption against discount, etc." />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, points: Number(form.points) })} disabled={!form.customerName || !form.points}>
          Add Transaction
        </Button>
      </div>
    </div>
  );
}

export default function MarketingLoyalty() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState(false);

  const { data: txns, isLoading } = useQuery<LoyaltyTxn[]>({
    queryKey: ["/v1/marketing/loyalty"],
    queryFn: () => api.get("/marketing/loyalty"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/marketing/loyalty"] });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/marketing/loyalty", d),
    onSuccess: () => { refresh(); setDialog(false); toast({ title: "Transaction added" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const list = txns ?? [];
  const totalEarned = list.filter((t) => t.type === "earn").reduce((s, t) => s + t.points, 0);
  const totalRedeemed = list.filter((t) => t.type === "redeem").reduce((s, t) => s + t.points, 0);
  const netPoints = totalEarned - totalRedeemed;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loyalty Program</h1>
          <p className="text-muted-foreground mt-1">Track loyalty points earned and redeemed by customers.</p>
        </div>
        <Button onClick={() => setDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{totalEarned.toLocaleString("en-IN")}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Redeemed</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-amber-600">{totalRedeemed.toLocaleString("en-IN")}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Points</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{netPoints.toLocaleString("en-IN")}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Transaction Ledger</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : !list.length ? (
            <div className="text-center py-16">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first loyalty transaction.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell className="font-medium">{t.customerName}</TableCell>
                    <TableCell>
                      {t.type === "earn" ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><ArrowUpCircle className="h-3 w-3" />Earn</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><ArrowDownCircle className="h-3 w-3" />Redeem</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.reason || "—"}</TableCell>
                    <TableCell className={`text-right font-semibold ${t.type === "earn" ? "text-emerald-600" : "text-amber-600"}`}>
                      {t.type === "earn" ? "+" : "−"}{t.points.toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Loyalty Transaction</DialogTitle></DialogHeader>
          <LoyaltyForm onSave={(d) => createMut.mutate(d)} onCancel={() => setDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
