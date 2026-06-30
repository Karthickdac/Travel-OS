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
import { CalendarOff, Plus, Check, X, Clock } from "lucide-react";

type Driver = { id: string; name: string; phone?: string };
type LeaveRow = {
  leave: {
    id: string; driverId: string; fromDate: string; toDate: string;
    type: string; reason?: string; status: string; createdAt: string;
  };
  driverName: string | null;
};

const LEAVE_TYPES = ["casual", "sick", "emergency", "unpaid"];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function ApplyLeaveForm({ drivers, onSave, onCancel, saving }: { drivers: Driver[]; onSave: (d: any) => void; onCancel: () => void; saving: boolean }) {
  const [form, setForm] = useState<Record<string, any>>({ driverId: "", fromDate: "", toDate: "", type: "casual", reason: "" });
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
          <Label>From Date *</Label>
          <Input type="date" value={form.fromDate} onChange={set("fromDate")} />
        </div>
        <div className="space-y-1.5">
          <Label>To Date *</Label>
          <Input type="date" value={form.toDate} onChange={set("toDate")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Leave Type *</Label>
          <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEAVE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Reason</Label>
          <Input value={form.reason} onChange={set("reason")} placeholder="Reason for leave" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.driverId || !form.fromDate || !form.toDate || saving}>Apply Leave</Button>
      </div>
    </div>
  );
}

export default function DriverLeave() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState(false);
  const [filter, setFilter] = useState("all");

  const { data: leaves, isLoading } = useQuery<LeaveRow[]>({
    queryKey: ["/v1/drivers/leave"],
    queryFn: () => api.get("/drivers/leave"),
  });
  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ["/v1/drivers"],
    queryFn: () => api.get("/drivers"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/drivers/leave"] });

  const applyMut = useMutation({
    mutationFn: ({ driverId, ...d }: any) => api.post(`/drivers/${driverId}/leave`, d),
    onSuccess: () => { refresh(); setDialog(false); toast({ title: "Leave applied" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/drivers/leave/${id}`, { status }),
    onSuccess: () => { refresh(); toast({ title: "Leave updated" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const rows = (leaves ?? []).filter(r => filter === "all" || r.leave.status === filter);
  const pending = (leaves ?? []).filter(r => r.leave.status === "pending").length;
  const approved = (leaves ?? []).filter(r => r.leave.status === "approved").length;
  const rejected = (leaves ?? []).filter(r => r.leave.status === "rejected").length;

  const days = (from: string, to: string) => Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Leave</h1>
          <p className="text-muted-foreground mt-1">Manage leave requests and approvals.</p>
        </div>
        <Button onClick={() => setDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> Apply Leave</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{leaves?.length ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-amber-600">{pending}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{approved}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-500">{rejected}</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : !rows.length ? (
        <Card className="text-center py-16"><CardContent className="pt-6"><CalendarOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No leave requests</p><p className="text-sm text-muted-foreground mt-1">Apply leave on behalf of a driver to get started.</p></CardContent></Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ leave, driverName }) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">{driverName ?? "—"}</TableCell>
                    <TableCell className="capitalize">{leave.type}</TableCell>
                    <TableCell>{new Date(leave.fromDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(leave.toDate).toLocaleDateString()}</TableCell>
                    <TableCell>{days(leave.fromDate, leave.toDate)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{leave.reason ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={`capitalize ${statusBadge(leave.status)}`}>{leave.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {leave.status === "pending" ? (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => statusMut.mutate({ id: leave.id, status: "approved" })}><Check className="h-3.5 w-3.5 mr-1" />Approve</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => statusMut.mutate({ id: leave.id, status: "rejected" })}><X className="h-3.5 w-3.5 mr-1" />Reject</Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(leave.createdAt).toLocaleDateString()}</span>
                      )}
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
          <DialogHeader><DialogTitle>Apply Leave</DialogTitle></DialogHeader>
          {dialog && <ApplyLeaveForm drivers={drivers ?? []} onSave={d => applyMut.mutate(d)} onCancel={() => setDialog(false)} saving={applyMut.isPending} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
