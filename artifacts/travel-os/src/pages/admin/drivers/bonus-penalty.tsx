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
import { Gift, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";

type Driver = { id: string; name: string; phone?: string };
type Entry = {
  entry: { id: string; driverId: string; type: string; amount: string; reason: string; date: string; createdAt: string };
  driverName: string | null;
};

function AddForm({ drivers, onSave, onCancel, saving }: { drivers: Driver[]; onSave: (d: any) => void; onCancel: () => void; saving: boolean }) {
  const [form, setForm] = useState<Record<string, any>>({ driverId: "", type: "bonus", amount: "", reason: "", date: new Date().toISOString().slice(0, 10) });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Driver *</Label>
          <Select value={form.driverId} onValueChange={v => setForm(f => ({ ...f, driverId: v }))}>
            <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
            <SelectContent>
              {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}{d.phone ? ` · ${d.phone}` : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bonus">Bonus</SelectItem>
              <SelectItem value="penalty">Penalty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Amount (₹) *</Label>
          <Input type="number" value={form.amount} onChange={set("amount")} placeholder="500" min="0" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Date *</Label>
          <Input type="date" value={form.date} onChange={set("date")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Reason *</Label>
          <Input value={form.reason} onChange={set("reason")} placeholder="Reason for bonus / penalty" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, amount: String(form.amount) })} disabled={!form.driverId || !form.amount || !form.reason || saving}>Add Entry</Button>
      </div>
    </div>
  );
}

export default function DriverBonusPenalty() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState(false);
  const [filter, setFilter] = useState("all");

  const { data: entries, isLoading } = useQuery<Entry[]>({
    queryKey: ["/v1/drivers/bonus-penalty"],
    queryFn: () => api.get("/drivers/bonus-penalty"),
  });
  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ["/v1/drivers"],
    queryFn: () => api.get("/drivers"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/drivers/bonus-penalty"] });

  const addMut = useMutation({
    mutationFn: ({ driverId, ...d }: any) => api.post(`/drivers/${driverId}/bonus-penalty`, d),
    onSuccess: () => { refresh(); setDialog(false); toast({ title: "Entry added" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/drivers/bonus-penalty/${id}`),
    onSuccess: () => { refresh(); toast({ title: "Entry deleted" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const all = entries ?? [];
  const totalBonus = all.filter(e => e.entry.type === "bonus").reduce((s, e) => s + Number(e.entry.amount), 0);
  const totalPenalty = all.filter(e => e.entry.type === "penalty").reduce((s, e) => s + Number(e.entry.amount), 0);
  const net = totalBonus - totalPenalty;
  const rows = all.filter(e => filter === "all" || e.entry.type === filter);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bonus & Penalty</h1>
          <p className="text-muted-foreground mt-1">Track driver incentives and deductions.</p>
        </div>
        <Button onClick={() => setDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Entry</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Bonus</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">₹{totalBonus.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Penalty</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-500">₹{totalPenalty.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Impact</CardTitle></CardHeader><CardContent><p className={`text-3xl font-bold ${net >= 0 ? "text-emerald-600" : "text-red-500"}`}>₹{net.toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="bonus">Bonus</SelectItem>
            <SelectItem value="penalty">Penalty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : !rows.length ? (
        <Card className="text-center py-16"><CardContent className="pt-6"><Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No entries yet</p><p className="text-sm text-muted-foreground mt-1">Add a bonus or penalty entry for a driver.</p></CardContent></Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ entry, driverName }) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{driverName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={entry.type === "bonus" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
                        {entry.type === "bonus" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        <span className="capitalize">{entry.type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-semibold ${entry.type === "bonus" ? "text-emerald-600" : "text-red-500"}`}>{entry.type === "bonus" ? "+" : "-"}₹{Number(entry.amount).toLocaleString()}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">{entry.reason}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete this entry?")) deleteMut.mutate(entry.id); }}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Add Bonus / Penalty</DialogTitle></DialogHeader>
          {dialog && <AddForm drivers={drivers ?? []} onSave={d => addMut.mutate(d)} onCancel={() => setDialog(false)} saving={addMut.isPending} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
