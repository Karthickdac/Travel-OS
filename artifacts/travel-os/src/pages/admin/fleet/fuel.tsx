import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Fuel, Plus, Trash2, Droplets, IndianRupee, Gauge, Car } from "lucide-react";

type Vehicle = { id: string; registrationNumber: string; make?: string; model?: string };
type FuelRow = {
  log: {
    id: string; vehicleId: string; date: string; litres: string;
    odometer: number; cost: string; station?: string | null;
  };
  vehicleRegNo: string | null;
  vehicleModel: string | null;
};

const BLANK = { vehicleId: "", date: new Date().toISOString().slice(0, 10), litres: "", odometer: "", cost: "", station: "" };

export default function AdminFleetFuel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(BLANK);

  const { data: rows, isLoading } = useQuery<FuelRow[]>({
    queryKey: ["/v1/fleet/fuel"],
    queryFn: () => api.get("/fleet/fuel"),
  });
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/v1/fleet/vehicles"],
    queryFn: () => api.get("/fleet/vehicles"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/fleet/fuel"] });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/fleet/fuel", d),
    onSuccess: () => { refresh(); setOpen(false); setForm(BLANK); toast({ title: "Fuel log added" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/fleet/fuel/${id}`),
    onSuccess: () => { refresh(); toast({ title: "Fuel log deleted" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.vehicleId || !form.litres || !form.cost) { toast({ title: "Vehicle, litres and cost are required", variant: "destructive" }); return; }
    createMut.mutate({
      vehicleId: form.vehicleId,
      date: form.date,
      litres: form.litres,
      odometer: form.odometer ? Number(form.odometer) : 0,
      cost: form.cost,
      station: form.station || undefined,
    });
  };

  const list = rows ?? [];
  const totalLitres = list.reduce((s, r) => s + Number(r.log.litres), 0);
  const totalCost = list.reduce((s, r) => s + Number(r.log.cost), 0);
  const avgPrice = totalLitres > 0 ? totalCost / totalLitres : 0;

  // Average mileage: derive per vehicle from consecutive odometer readings.
  const byVehicle: Record<string, FuelRow[]> = {};
  for (const r of list) {
    (byVehicle[r.log.vehicleId] ??= []).push(r);
  }
  let distance = 0, litresForMileage = 0;
  for (const vId in byVehicle) {
    const logs = byVehicle[vId]
      .filter(r => r.log.odometer > 0)
      .sort((a, b) => a.log.odometer - b.log.odometer);
    for (let i = 1; i < logs.length; i++) {
      const d = logs[i].log.odometer - logs[i - 1].log.odometer;
      if (d > 0) { distance += d; litresForMileage += Number(logs[i].log.litres); }
    }
  }
  const avgMileage = litresForMileage > 0 ? distance / litresForMileage : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuel Logs</h1>
          <p className="text-muted-foreground mt-1">Track fuel consumption and costs across your fleet.</p>
        </div>
        <Button onClick={() => { setForm(BLANK); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Add Log</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Total Litres</CardTitle><Droplets className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalLitres.toLocaleString(undefined, { maximumFractionDigits: 1 })} L</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle><IndianRupee className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">₹{totalCost.toLocaleString()}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Price / L</CardTitle><Fuel className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">₹{avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Mileage</CardTitle><Gauge className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{avgMileage > 0 ? `${avgMileage.toFixed(1)} km/L` : "—"}</p></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle>Fuel Entries</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !list.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Fuel className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No fuel logs yet</p>
              <p className="text-sm">Add your first fuel entry to start tracking.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead className="text-right">Litres</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(r => (
                  <TableRow key={r.log.id}>
                    <TableCell>{new Date(r.log.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{r.vehicleRegNo ?? "—"}</span>
                        {r.vehicleModel && <span className="text-xs text-muted-foreground">{r.vehicleModel}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{r.log.station ?? "—"}</TableCell>
                    <TableCell className="text-right">{Number(r.log.litres).toLocaleString()} L</TableCell>
                    <TableCell className="text-right">{r.log.odometer ? `${r.log.odometer.toLocaleString()} km` : "—"}</TableCell>
                    <TableCell className="text-right font-medium">₹{Number(r.log.cost).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete this fuel log?")) deleteMut.mutate(r.log.id); }}>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Fuel Log</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Vehicle *</Label>
              <Select value={form.vehicleId} onValueChange={v => setForm(f => ({ ...f, vehicleId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {(vehicles ?? []).map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.registrationNumber}{v.model ? ` — ${v.model}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={set("date")} />
              </div>
              <div className="space-y-1.5">
                <Label>Station</Label>
                <Input value={form.station} onChange={set("station")} placeholder="HP Petrol Pump" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Litres *</Label>
                <Input type="number" value={form.litres} onChange={set("litres")} placeholder="40" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Odometer</Label>
                <Input type="number" value={form.odometer} onChange={set("odometer")} placeholder="50000" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Cost (₹) *</Label>
                <Input type="number" value={form.cost} onChange={set("cost")} placeholder="4000" min="0" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMut.isPending}>Add Log</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
