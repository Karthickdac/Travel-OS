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
import { Nfc, Plus, Trash2, Car, Copy, Radio, KeyRound, Pencil, Satellite, Link2 } from "lucide-react";

type Vehicle = { id: string; registrationNumber: string; model?: string };
type Device = {
  id: string;
  deviceId: string;
  provider: string;
  label: string | null;
  simNumber: string | null;
  ingestKey: string;
  vehicleId: string | null;
  status: string;
  lastLat: number | null;
  lastLng: number | null;
  lastPingAt: string | null;
  vehicleReg: string | null;
  vehicleModel: string | null;
};
type TbtrackConfig = { configured: boolean; url: string | null };

const BLANK = { deviceId: "", label: "", simNumber: "", vehicleId: "", status: "active" };
const UNASSIGNED = "__none__";

export default function AdminFleetDevices() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(BLANK);

  const { data: devices, isLoading } = useQuery<Device[]>({
    queryKey: ["/v1/gps/devices"],
    queryFn: () => api.get("/gps/devices"),
  });
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/v1/fleet/vehicles"],
    queryFn: () => api.get("/fleet/vehicles"),
  });
  const { data: tbtrack } = useQuery<TbtrackConfig>({
    queryKey: ["/v1/gps/tbtrack/config"],
    queryFn: () => api.get("/gps/tbtrack/config"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/gps/devices"] });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/gps/devices", d),
    onSuccess: () => { refresh(); setOpen(false); setForm(BLANK); toast({ title: "Device registered" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => api.put(`/gps/devices/${id}`, d),
    onSuccess: () => { refresh(); setOpen(false); setEditId(null); setForm(BLANK); toast({ title: "Device updated" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/gps/devices/${id}`),
    onSuccess: () => { refresh(); toast({ title: "Device removed" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openCreate = () => { setEditId(null); setForm(BLANK); setOpen(true); };
  const openEdit = (d: Device) => {
    setEditId(d.id);
    setForm({ deviceId: d.deviceId, label: d.label ?? "", simNumber: d.simNumber ?? "", vehicleId: d.vehicleId ?? "", status: d.status });
    setOpen(true);
  };

  const handleSave = () => {
    if (!editId && !form.deviceId.trim()) { toast({ title: "Device ID / IMEI is required", variant: "destructive" }); return; }
    const payload = {
      deviceId: form.deviceId.trim(),
      label: form.label || undefined,
      simNumber: form.simNumber || undefined,
      vehicleId: form.vehicleId || null,
      status: form.status,
    };
    if (editId) updateMut.mutate({ id: editId, d: payload });
    else createMut.mutate(payload);
  };

  const copyKey = (k: string) => { navigator.clipboard?.writeText(k); toast({ title: "Ingest key copied" }); };
  const copyUrl = (u: string) => { navigator.clipboard?.writeText(u); toast({ title: "TB Track URL copied" }); };

  const list = devices ?? [];
  const online = list.filter((d) => d.status === "active" && d.lastPingAt).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GPS Devices</h1>
          <p className="text-muted-foreground mt-1">Register GPS trackers and assign them to vehicles.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Register Device</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle><Nfc className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{list.length}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Reporting</CardTitle><Radio className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{online}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Assigned</CardTitle><Car className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{list.filter((d) => d.vehicleId).length}</p></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle>Registered Devices</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !list.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Nfc className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No GPS devices registered</p>
              <p className="text-sm">Register a tracker to start monitoring your fleet live.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Ping</TableHead>
                  <TableHead>Ingest Key</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-1.5">
                        {d.label || d.deviceId}
                        {d.provider === "tbtrack" && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0">TB Track</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{d.deviceId}{d.simNumber ? ` · SIM ${d.simNumber}` : ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{d.vehicleReg ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>
                      {d.status === "active"
                        ? <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                        : <Badge variant="outline">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.lastPingAt ? new Date(d.lastPingAt).toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="gap-1.5 font-mono text-xs" onClick={() => copyKey(d.ingestKey)}>
                        <KeyRound className="h-3 w-3" />{d.ingestKey.slice(0, 8)}…<Copy className="h-3 w-3" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Remove this device?")) deleteMut.mutate(d.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-dashed">
        <CardHeader><CardTitle className="text-base">Connecting real hardware</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Any GPS tracker that can make HTTP requests can push locations to TravelOS. Configure your device to POST to:</p>
          <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto"><code>{`POST /api/v1/gps/ingest
{
  "deviceId": "<your device id / IMEI>",
  "key": "<ingest key from the table above>",
  "lat": 11.0168,
  "lng": 76.9558,
  "speed": 42,
  "heading": 90,
  "bookingId": "<optional: trip being driven>"
}`}</code></pre>
          <p>Positions appear instantly on the Live Tracking map. Distance for a trip accumulates automatically as pings arrive.</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary"><Satellite className="h-5 w-5" /></div>
            <div>
              <CardTitle className="text-base">TB Track (TrackoBit) integration</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Feed your TB Track / tbtrack.in trackers straight into TravelOS.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            In your TB Track / TrackoBit portal, open the <span className="font-medium text-foreground">data forwarding / HTTP push</span> (integration)
            settings and add the URL below as a destination. Each position your devices report will then flow into TravelOS automatically —
            new trackers register themselves the first time they report, and appear on the Live Tracking map.
          </p>
          {tbtrack?.configured && tbtrack.url ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted rounded-md p-3 text-xs break-all font-mono">{tbtrack.url}</code>
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => copyUrl(tbtrack.url!)}>
                <Link2 className="h-3.5 w-3.5" />Copy URL
              </Button>
            </div>
          ) : (
            <p className="text-amber-600">Webhook URL unavailable — the server signing key is not configured.</p>
          )}
          <p>
            The endpoint accepts both <span className="font-mono text-xs">POST</span> (JSON) and <span className="font-mono text-xs">GET</span> (query
            parameters), and understands the common TB Track / TrackoBit / Traccar field names:
            <span className="font-mono text-xs"> imei</span>, <span className="font-mono text-xs">lat</span>, <span className="font-mono text-xs">lng/lon</span>,
            <span className="font-mono text-xs"> speed</span>, <span className="font-mono text-xs">heading/course</span>, <span className="font-mono text-xs">timestamp</span>.
          </p>
          <p className="text-xs">Keep this URL private — it is unique to your company and lets your trackers post location data.</p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Device" : "Register GPS Device"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Device ID / IMEI *</Label>
              <Input value={form.deviceId} onChange={set("deviceId")} placeholder="e.g. 358899057123456" disabled={!!editId} />
            </div>
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input value={form.label} onChange={set("label")} placeholder="e.g. Innova Tracker" />
            </div>
            <div className="space-y-1.5">
              <Label>SIM Number</Label>
              <Input value={form.simNumber} onChange={set("simNumber")} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Assign to Vehicle</Label>
              <Select value={form.vehicleId || UNASSIGNED} onValueChange={(v) => setForm((f) => ({ ...f, vehicleId: v === UNASSIGNED ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {(vehicles ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registrationNumber}{v.model ? ` — ${v.model}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editId ? "Save" : "Register"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
