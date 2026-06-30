import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver, DriverStatus } from "@workspace/api-client-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Contact, Phone, Star, Plus, Search, Pencil, Trash2, IdCard, UserCheck, Car, AlertCircle, Users, CalendarDays, IndianRupee, ChevronDown } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  on_trip: "bg-blue-100 text-blue-700 border-blue-200",
  off_duty: "bg-gray-100 text-gray-600 border-gray-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

const BLANK = { name: "", phone: "", email: "", licenseNumber: "", licenseExpiry: "" };

function DriverForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [status, setStatus] = useState<DriverStatus>(initial?.status ?? DriverStatus.available);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={set("name")} placeholder="Ravi Kumar" /></div>
        <div className="space-y-1.5"><Label>Phone *</Label><Input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} placeholder="driver@email.com" /></div>
        <div className="space-y-1.5"><Label>License Number *</Label><Input value={form.licenseNumber} onChange={set("licenseNumber")} placeholder="TN0120230012345" /></div>
        <div className="space-y-1.5"><Label>License Expiry</Label><Input type="date" value={form.licenseExpiry} onChange={set("licenseExpiry")} /></div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={v => setStatus(v as DriverStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(DriverStatus).map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, status })} disabled={!form.name || !form.phone || !form.licenseNumber}>{initial?.id ? "Save Changes" : "Add Driver"}</Button>
      </div>
    </div>
  );
}

const MONTHS = Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
const ATTEND_STATUS = ["present", "absent", "half_day", "leave"];
const ATTEND_COLOR: Record<string, string> = { present: "bg-emerald-100 text-emerald-700", absent: "bg-red-100 text-red-700", half_day: "bg-amber-100 text-amber-700", leave: "bg-blue-100 text-blue-700" };

function AttendanceTab({ driverId }: { driverId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [month, setMonth] = useState(MONTHS[0]);
  const { data: attendance, isLoading } = useQuery<any[]>({
    queryKey: [`/v1/drivers/${driverId}/attendance`, month],
    queryFn: () => api.get(`/drivers/${driverId}/attendance?month=${month}`),
  });
  const markMut = useMutation({
    mutationFn: (d: any) => api.post(`/drivers/${driverId}/attendance`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`/v1/drivers/${driverId}/attendance`] }); toast({ title: "Attendance marked" }); },
  });

  const today = new Date().toISOString().split("T")[0];
  const attended = attendance?.find(a => a.date === today);

  const daysInMonth = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    return { date: `${month}-${day}`, record: attendance?.find(a => a.date === `${month}-${day}`) };
  });
  const presentDays = attendance?.filter(a => a.status === "present" || a.status === "half_day").length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex gap-2">
          {ATTEND_STATUS.map(s => (
            <Button key={s} size="sm" variant="outline" className={attended?.status === s ? "ring-2 ring-primary" : ""} onClick={() => markMut.mutate({ date: today, status: s })}>
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${ATTEND_COLOR[s].split(" ")[0]}`} />
              {s.replace("_", " ")}
            </Button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">{presentDays} days present</div>
      </div>
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="grid grid-cols-7 gap-1">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>)}
          {Array.from({ length: new Date(`${month}-01`).getDay() }).map((_, i) => <div key={`e${i}`} />)}
          {days.map(({ date, record }) => (
            <div key={date} className={`aspect-square rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${record ? ATTEND_COLOR[record.status] : "bg-muted hover:bg-muted/70"} ${date === today ? "ring-2 ring-primary" : ""}`}
              onClick={() => { const idx = (ATTEND_STATUS.indexOf(record?.status ?? "absent") + 1) % ATTEND_STATUS.length; markMut.mutate({ date, status: ATTEND_STATUS[idx] }); }}>
              {parseInt(date.split("-")[2])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SalaryTab({ driverId }: { driverId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ month: MONTHS[0], baseSalary: "", tripIncentive: "", allowances: "", deductions: "", bonus: "", notes: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const net = [form.baseSalary, form.tripIncentive, form.allowances, form.bonus].reduce((s, v) => s + parseFloat(v || "0"), 0) - parseFloat(form.deductions || "0");
  const { data: salaryRecords, isLoading } = useQuery<any[]>({ queryKey: [`/v1/drivers/${driverId}/salary`], queryFn: () => api.get(`/drivers/${driverId}/salary`) });
  const saveMut = useMutation({ mutationFn: (d: any) => api.post(`/drivers/${driverId}/salary`, d), onSuccess: () => { qc.invalidateQueries({ queryKey: [`/v1/drivers/${driverId}/salary`] }); toast({ title: "Salary saved" }); } });
  const payMut = useMutation({ mutationFn: (id: string) => api.patch(`/drivers/salary/${id}/pay`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: [`/v1/drivers/${driverId}/salary`] }) });

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Generate Salary Slip</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>Month</Label><Select value={form.month} onValueChange={v => setForm(f => ({ ...f, month: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Base Salary (₹)</Label><Input type="number" value={form.baseSalary} onChange={set("baseSalary")} placeholder="15000" /></div>
            <div className="space-y-1.5"><Label>Trip Incentive (₹)</Label><Input type="number" value={form.tripIncentive} onChange={set("tripIncentive")} placeholder="2000" /></div>
            <div className="space-y-1.5"><Label>Allowances (₹)</Label><Input type="number" value={form.allowances} onChange={set("allowances")} placeholder="500" /></div>
            <div className="space-y-1.5"><Label>Deductions (₹)</Label><Input type="number" value={form.deductions} onChange={set("deductions")} placeholder="0" /></div>
            <div className="space-y-1.5"><Label>Bonus (₹)</Label><Input type="number" value={form.bonus} onChange={set("bonus")} placeholder="0" /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Input value={form.notes} onChange={set("notes")} placeholder="Any remarks" /></div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="text-sm font-medium text-muted-foreground">Net Salary</div>
              <div className="text-2xl font-bold text-emerald-600">₹{Math.max(0, net).toLocaleString()}</div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => saveMut.mutate({ ...form, baseSalary: Number(form.baseSalary) || 0, tripIncentive: Number(form.tripIncentive) || 0, allowances: Number(form.allowances) || 0, deductions: Number(form.deductions) || 0, bonus: Number(form.bonus) || 0 })} disabled={!form.baseSalary}>Save Salary Slip</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold">Salary History</h3>
        {isLoading ? <Skeleton className="h-20" /> : !salaryRecords?.length ? (
          <div className="text-center py-8 text-muted-foreground text-sm"><IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-50" />No salary records yet</div>
        ) : salaryRecords.map((r: any) => (
          <Card key={r.id} className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2"><p className="font-semibold">{r.month}</p><Badge variant="outline" className={r.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{r.status}</Badge></div>
                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                  <span>Base: ₹{r.baseSalary}</span>
                  <span>Incentive: ₹{r.tripIncentive}</span>
                  <span>Deductions: ₹{r.deductions}</span>
                  <span className="font-semibold text-foreground">Net: ₹{r.netSalary}</span>
                </div>
              </div>
              {r.status !== "paid" && <Button size="sm" variant="outline" onClick={() => { if(confirm("Mark salary as paid?")) payMut.mutate(r.id); }} className="gap-1"><IndianRupee className="h-3.5 w-3.5" />Mark Paid</Button>}
              {r.status === "paid" && <div className="text-xs text-muted-foreground">Paid {r.paidAt ? new Date(r.paidAt).toLocaleDateString() : ""}</div>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminDrivers() {
  const { data: drivers, isLoading } = useListDrivers();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data: any } | null>(null);
  const [form, setForm] = useState(BLANK);
  const [editStatus, setEditStatus] = useState<DriverStatus>(DriverStatus.available);
  const [selected, setSelected] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState("attendance");

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/drivers"] });

  const filtered = (drivers ?? []).filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search) || d.licenseNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async () => {
    try {
      if (dialog?.mode === "edit") {
        await updateDriver.mutateAsync({ id: dialog.data.id, data: { status: editStatus, licenseExpiry: form.licenseExpiry || undefined } });
        if (form.name !== dialog.data.name || form.phone !== dialog.data.phone || form.licenseNumber !== dialog.data.licenseNumber)
          await api.patch(`/drivers/${dialog.data.id}`, form);
        toast({ title: "Driver updated" });
      } else {
        await createDriver.mutateAsync({ data: { name: form.name, phone: form.phone, email: form.email || undefined, licenseNumber: form.licenseNumber, licenseExpiry: form.licenseExpiry || undefined } });
        toast({ title: "Driver added" });
      }
      refresh(); setDialog(null);
    } catch { toast({ title: "Error saving driver", variant: "destructive" }); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete driver "${name}"?`)) return;
    try { await deleteDriver.mutateAsync({ id }); toast({ title: "Driver removed" }); refresh(); }
    catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const statusCounts = { all: drivers?.length ?? 0, available: drivers?.filter(d => d.status === "available").length ?? 0, on_trip: drivers?.filter(d => d.status === "on_trip").length ?? 0, off_duty: drivers?.filter(d => d.status === "off_duty").length ?? 0 };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Drivers</h1><p className="text-muted-foreground mt-1">Manage drivers, attendance, and salary records.</p></div>
        <Button onClick={() => { setForm(BLANK); setEditStatus(DriverStatus.available); setDialog({ mode: "create", data: null }); }} className="gap-2"><Plus className="h-4 w-4" /> Add Driver</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[["All", statusCounts.all, ""], ["Available", statusCounts.available, "text-emerald-600"], ["On Trip", statusCounts.on_trip, "text-blue-600"], ["Off Duty", statusCounts.off_duty, "text-gray-500"]].map(([label, val, cls]) => (
          <Card key={label as string}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader><CardContent><p className={`text-3xl font-bold ${cls}`}>{val}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search drivers…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Status</SelectItem>{Object.values(DriverStatus).map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}</div> :
        !filtered.length ? <Card className="text-center py-16"><CardContent><Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No drivers found</p></CardContent></Card> : (
          <div className="space-y-3">
            {filtered.map(d => (
              <Card key={d.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">{d.name.charAt(0)}</div>
                      <div>
                        <p className="font-semibold">{d.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{d.phone}</span>
                          <span className="flex items-center gap-1"><IdCard className="h-3 w-3" />{d.licenseNumber}</span>
                          {d.rating && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{d.rating}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={STATUS_COLORS[d.status ?? "available"]}>{d.status?.replace("_", " ")}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => { setForm({ name: d.name, phone: d.phone, email: d.email ?? "", licenseNumber: d.licenseNumber, licenseExpiry: d.licenseExpiry ?? "" }); setEditStatus(d.status as DriverStatus ?? DriverStatus.available); setDialog({ mode: "edit", data: d }); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(d.id, d.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => setSelected(selected?.id === d.id ? null : d)} className="gap-1">{selected?.id === d.id ? "Close" : "Details"}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${selected?.id === d.id ? "rotate-180" : ""}`} /></Button>
                    </div>
                  </div>
                  {selected?.id === d.id && (
                    <div className="mt-4 border-t pt-4">
                      <Tabs value={detailTab} onValueChange={setDetailTab}>
                        <TabsList><TabsTrigger value="attendance"><CalendarDays className="h-3.5 w-3.5 mr-1.5" />Attendance</TabsTrigger><TabsTrigger value="salary"><IndianRupee className="h-3.5 w-3.5 mr-1.5" />Salary</TabsTrigger></TabsList>
                        <TabsContent value="attendance" className="mt-3"><AttendanceTab driverId={d.id} /></TabsContent>
                        <TabsContent value="salary" className="mt-3"><SalaryTab driverId={d.id} /></TabsContent>
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{dialog?.mode === "edit" ? "Edit Driver" : "Add New Driver"}</DialogTitle></DialogHeader>
          {dialog && <DriverForm initial={dialog.data} onSave={d => { setForm(d); handleSave(); }} onCancel={() => setDialog(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
