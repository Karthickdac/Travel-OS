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
import { TriangleAlert, Plus, Car, IndianRupee, Wrench, CheckCircle2 } from "lucide-react";

type Vehicle = { id: string; registrationNumber: string; make?: string; model?: string };
type AccidentRow = {
  record: {
    id: string; vehicleId: string; date: string; description: string;
    severity: string; cost: string; status: string;
  };
  vehicleRegNo: string | null;
  vehicleModel: string | null;
};

const BLANK = { vehicleId: "", date: new Date().toISOString().slice(0, 10), description: "", severity: "minor", cost: "", status: "open" };

function severityBadge(s: string) {
  if (s === "minor") return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Minor</Badge>;
  if (s === "major") return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Major</Badge>;
  if (s === "total") return <Badge className="bg-red-100 text-red-700 border-red-200">Total Loss</Badge>;
  return <Badge variant="outline">{s}</Badge>;
}
function statusBadge(s: string) {
  if (s === "open") return <Badge className="bg-red-100 text-red-700 border-red-200">Open</Badge>;
  if (s === "under_repair") return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Under Repair</Badge>;
  if (s === "resolved") return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Resolved</Badge>;
  return <Badge variant="outline">{s}</Badge>;
}

export default function AdminFleetAccidents() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(BLANK);
  const [editRow, setEditRow] = useState<AccidentRow | null>(null);
  const [editForm, setEditForm] = useState<{ status: string; cost: string }>({ status: "open", cost: "" });

  const { data: rows, isLoading } = useQuery<AccidentRow[]>({
    queryKey: ["/v1/fleet/accidents"],
    queryFn: () => api.get("/fleet/accidents"),
  });
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/v1/fleet/vehicles"],
    queryFn: () => api.get("/fleet/vehicles"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/fleet/accidents"] });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/fleet/accidents", d),
    onSuccess: () => { refresh(); setOpen(false); setForm(BLANK); toast({ title: "Accident record added" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => api.patch(`/fleet/accidents/${id}`, d),
    onSuccess: () => { refresh(); setEditRow(null); toast({ title: "Record updated" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.vehicleId || !form.description) { toast({ title: "Vehicle and description are required", variant: "destructive" }); return; }
    createMut.mutate({
      vehicleId: form.vehicleId,
      date: form.date,
      description: form.description,
      severity: form.severity,
      cost: form.cost || "0",
      status: form.status,
    });
  };

  const openEdit = (r: AccidentRow) => { setEditRow(r); setEditForm({ status: r.record.status, cost: String(r.record.cost) }); };
  const handleUpdate = () => {
    if (!editRow) return;
    updateMut.mutate({ id: editRow.record.id, status: editForm.status, cost: editForm.cost || "0" });
  };

  const list = rows ?? [];
  const openCount = list.filter(r => r.record.status === "open").length;
  const repairCount = list.filter(r => r.record.status === "under_repair").length;
  const totalCost = list.reduce((s, r) => s + Number(r.record.cost), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accident Records</h1>
          <p className="text-muted-foreground mt-1">Log accidents, track repair status and costs.</p>
        </div>
        <Button onClick={() => { setForm(BLANK); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />New Record</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle><TriangleAlert className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{list.length}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle><TriangleAlert className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{openCount}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Under Repair</CardTitle><Wrench className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{repairCount}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle><IndianRupee className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">₹{totalCost.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : !list.length ? (
        <Card className="text-center py-16"><CardContent className="pt-6"><TriangleAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No accident records</p><p className="text-sm text-muted-foreground mt-1">Log an accident to start tracking repairs.</p></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map(r => (
            <Card key={r.record.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold">{r.vehicleRegNo ?? "—"}</span>
                    {r.vehicleModel && <span className="text-xs text-muted-foreground">{r.vehicleModel}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(r.record.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {severityBadge(r.record.severity)}
                  {statusBadge(r.record.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{r.record.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{Number(r.record.cost).toLocaleString()}</span>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                    {r.record.status === "resolved" ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <Wrench className="h-3.5 w-3.5 mr-1" />}
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Accident Record</DialogTitle></DialogHeader>
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
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={set("date")} />
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={set("description")} placeholder="What happened?" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="total">Total Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Est. Cost (₹)</Label>
                <Input type="number" value={form.cost} onChange={set("cost")} placeholder="0" min="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_repair">Under Repair</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMut.isPending}>Add Record</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={() => setEditRow(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update — {editRow?.vehicleRegNo}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_repair">Under Repair</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cost (₹)</Label>
              <Input type="number" value={editForm.cost} onChange={e => setEditForm(f => ({ ...f, cost: e.target.value }))} min="0" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={updateMut.isPending}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
