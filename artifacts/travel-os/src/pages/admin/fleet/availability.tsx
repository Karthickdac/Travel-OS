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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CalendarOff, Plus, Trash2, Car, CalendarClock, Wrench } from "lucide-react";

type Vehicle = { id: string; registrationNumber: string; make?: string; model?: string };
type AvailRow = {
  block: {
    id: string; vehicleId: string; fromDate: string; toDate: string;
    reason: string; notes?: string | null;
  };
  vehicleRegNo: string | null;
  vehicleModel: string | null;
};

const BLANK = { vehicleId: "", fromDate: new Date().toISOString().slice(0, 10), toDate: new Date().toISOString().slice(0, 10), reason: "off_road", notes: "" };

const REASONS: Record<string, string> = {
  off_road: "Off Road",
  maintenance: "Maintenance",
  booked: "Booked",
  reserved: "Reserved",
};

function reasonBadge(r: string) {
  if (r === "off_road") return <Badge className="bg-red-100 text-red-700 border-red-200">Off Road</Badge>;
  if (r === "maintenance") return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Maintenance</Badge>;
  if (r === "booked") return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Booked</Badge>;
  if (r === "reserved") return <Badge className="bg-violet-100 text-violet-700 border-violet-200">Reserved</Badge>;
  return <Badge variant="outline">{r}</Badge>;
}

export default function AdminFleetAvailability() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(BLANK);

  const { data: rows, isLoading } = useQuery<AvailRow[]>({
    queryKey: ["/v1/fleet/availability"],
    queryFn: () => api.get("/fleet/availability"),
  });
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/v1/fleet/vehicles"],
    queryFn: () => api.get("/fleet/vehicles"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/fleet/availability"] });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/fleet/availability", d),
    onSuccess: () => { refresh(); setOpen(false); setForm(BLANK); toast({ title: "Block added" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/fleet/availability/${id}`),
    onSuccess: () => { refresh(); toast({ title: "Block removed" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.vehicleId || !form.fromDate || !form.toDate) { toast({ title: "Vehicle and dates are required", variant: "destructive" }); return; }
    if (form.toDate < form.fromDate) { toast({ title: "End date must be after start date", variant: "destructive" }); return; }
    createMut.mutate({
      vehicleId: form.vehicleId,
      fromDate: form.fromDate,
      toDate: form.toDate,
      reason: form.reason,
      notes: form.notes || undefined,
    });
  };

  const list = rows ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const activeCount = list.filter(r => r.block.fromDate <= today && r.block.toDate >= today).length;
  const upcomingCount = list.filter(r => r.block.fromDate > today).length;
  const offRoadCount = list.filter(r => r.block.reason === "off_road" || r.block.reason === "maintenance").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Availability</h1>
          <p className="text-muted-foreground mt-1">Manage off-road, maintenance and reserved blocks for your fleet.</p>
        </div>
        <Button onClick={() => { setForm(BLANK); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Add Block</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Total Blocks</CardTitle><CalendarOff className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{list.length}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle><CalendarOff className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{activeCount}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle><CalendarClock className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{upcomingCount}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Off Road / Maint.</CardTitle><Wrench className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{offRoadCount}</p></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle>Availability Blocks</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !list.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarOff className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No availability blocks</p>
              <p className="text-sm">Add a block to mark vehicles as unavailable.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(r => {
                  const active = r.block.fromDate <= today && r.block.toDate >= today;
                  return (
                    <TableRow key={r.block.id} className={active ? "bg-red-50/40" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{r.vehicleRegNo ?? "—"}</span>
                          {r.vehicleModel && <span className="text-xs text-muted-foreground">{r.vehicleModel}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{reasonBadge(r.block.reason)}</TableCell>
                      <TableCell>{new Date(r.block.fromDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(r.block.toDate).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{r.block.notes ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Remove this block?")) deleteMut.mutate(r.block.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Availability Block</DialogTitle></DialogHeader>
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
                <Label>From *</Label>
                <Input type="date" value={form.fromDate} onChange={set("fromDate")} />
              </div>
              <div className="space-y-1.5">
                <Label>To *</Label>
                <Input type="date" value={form.toDate} onChange={set("toDate")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REASONS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={set("notes")} placeholder="Additional details…" rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMut.isPending}>Add Block</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
