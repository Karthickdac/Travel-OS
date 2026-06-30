import { useState, useMemo } from "react";
import {
  useListExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense,
  useListVehicles, useListDrivers,
} from "@workspace/api-client-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Receipt, Plus, Fuel, Wrench, Users, Car, FileText,
  IndianRupee, Pencil, Trash2, Search, TrendingDown,
  TrendingUp, ChevronDown, ChevronUp,
} from "lucide-react";
import { format, parseISO, isSameMonth, subMonths } from "date-fns";

const CATEGORIES = [
  { value: "fuel",         label: "Fuel",          icon: Fuel,          color: "#f97316" },
  { value: "maintenance",  label: "Maintenance",    icon: Wrench,        color: "#0d9488" },
  { value: "salary",       label: "Driver Salary",  icon: Users,         color: "#3b82f6" },
  { value: "insurance",    label: "Insurance",      icon: FileText,      color: "#8b5cf6" },
  { value: "vehicle_tax",  label: "Vehicle Tax",    icon: Car,           color: "#ec4899" },
  { value: "office",       label: "Office",         icon: IndianRupee,   color: "#eab308" },
  { value: "marketing",    label: "Marketing",      icon: IndianRupee,   color: "#14b8a6" },
  { value: "toll",         label: "Toll / Road",    icon: Car,           color: "#6366f1" },
  { value: "misc",         label: "Miscellaneous",  icon: Receipt,       color: "#94a3b8" },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

const EMPTY_FORM = {
  description: "", category: "fuel", amount: "", vendorName: "",
  date: new Date().toISOString().split("T")[0],
  vehicleId: "", vehicleNumber: "", driverId: "", driverName: "", notes: "",
};

function formatCurrency(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString()}`;
}

export default function AdminFinanceExpenses() {
  const { data: expenses, isLoading } = useListExpenses();
  const { data: vehicles } = useListVehicles();
  const { data: drivers } = useListDrivers();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data: any } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/finance/expenses"] });

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    (expenses ?? []).forEach(e => { if (e.date) months.add(e.date.slice(0, 7)); });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  const vehicleOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: string[] = [];
    (expenses ?? []).forEach(e => { if (e.vehicleNumber && !seen.has(e.vehicleNumber)) { seen.add(e.vehicleNumber); opts.push(e.vehicleNumber); } });
    return opts;
  }, [expenses]);

  const filtered = useMemo(() => {
    let list = (expenses ?? []).filter(e => {
      const matchSearch = !search
        || (e.description ?? "").toLowerCase().includes(search.toLowerCase())
        || (e.vendorName ?? "").toLowerCase().includes(search.toLowerCase())
        || (e.vehicleNumber ?? "").toLowerCase().includes(search.toLowerCase())
        || (e.driverName ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || e.category === catFilter;
      const matchVehicle = vehicleFilter === "all" || e.vehicleNumber === vehicleFilter;
      const matchMonth = monthFilter === "all" || (e.date ?? "").startsWith(monthFilter);
      return matchSearch && matchCat && matchVehicle && matchMonth;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "date") {
        const diff = (a.date ?? "").localeCompare(b.date ?? "");
        return sortDir === "desc" ? -diff : diff;
      }
      const diff = Number(a.amount ?? 0) - Number(b.amount ?? 0);
      return sortDir === "desc" ? -diff : diff;
    });
    return list;
  }, [expenses, search, catFilter, vehicleFilter, monthFilter, sortBy, sortDir]);

  const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const thisMonth = (expenses ?? []).filter(e => e.date && isSameMonth(parseISO(e.date), new Date())).reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const lastMonth = (expenses ?? []).filter(e => e.date && isSameMonth(parseISO(e.date), subMonths(new Date(), 1))).reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const monthDelta = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  const byCategory = CATEGORIES.map(c => ({
    name: c.label, value: (expenses ?? []).filter(e => e.category === c.value).reduce((s, e) => s + Number(e.amount ?? 0), 0), color: c.color,
  })).filter(c => c.value > 0);

  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(new Date(), 5 - i);
      const label = format(m, "MMM");
      const value = (expenses ?? []).filter(e => e.date && isSameMonth(parseISO(e.date), m)).reduce((s, e) => s + Number(e.amount ?? 0), 0);
      return { label, value };
    });
  }, [expenses]);

  const openCreate = () => { setForm(EMPTY_FORM); setDialog({ mode: "create", data: null }); };
  const openEdit = (e: any) => {
    setForm({
      description: e.description, category: e.category, amount: String(e.amount),
      vendorName: e.vendorName ?? "", date: e.date,
      vehicleId: e.vehicleId ?? "", vehicleNumber: e.vehicleNumber ?? "",
      driverId: e.driverId ?? "", driverName: e.driverName ?? "", notes: e.notes ?? "",
    });
    setDialog({ mode: "edit", data: e });
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const v = (vehicles ?? []).find(v => v.id === vehicleId);
    setForm(f => ({ ...f, vehicleId, vehicleNumber: v?.registrationNumber ?? "" }));
  };

  const handleDriverSelect = (driverId: string) => {
    const d = (drivers ?? []).find(d => d.id === driverId);
    setForm(f => ({ ...f, driverId, driverName: d?.name ?? "" }));
  };

  const handleSave = async () => {
    if (!form.description || !form.amount) {
      toast({ title: "Description and amount are required", variant: "destructive" }); return;
    }
    const payload = {
      description: form.description,
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      vendorName: form.vendorName || undefined,
      vehicleId: form.vehicleId || undefined,
      vehicleNumber: form.vehicleNumber || undefined,
      driverId: form.driverId || undefined,
      driverName: form.driverName || undefined,
      notes: form.notes || undefined,
    };
    try {
      if (dialog?.mode === "create") {
        await createExpense.mutateAsync({ data: payload });
        toast({ title: "Expense recorded" });
      } else {
        await updateExpense.mutateAsync({ id: dialog!.data.id, data: payload });
        toast({ title: "Expense updated" });
      }
      refresh(); setDialog(null);
    } catch { toast({ title: "Failed to save expense", variant: "destructive" }); }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (!confirm(`Delete expense "${desc}"?`)) return;
    try {
      await deleteExpense.mutateAsync({ id });
      toast({ title: "Expense deleted" });
      refresh();
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const toggleSort = (col: "date" | "amount") => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(e => {
      const key = e.date ? e.date.slice(0, 7) : "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground mt-1">Track, categorise, and analyse all business expenses.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Expense</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Total All Time</p>
            <p className="text-2xl font-black text-primary">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{expenses?.length ?? 0} entries</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">This Month</p>
            <p className="text-2xl font-black">{formatCurrency(thisMonth)}</p>
            <p className={`text-xs mt-0.5 flex items-center gap-1 ${monthDelta > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {monthDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(monthDelta).toFixed(0)}% vs last month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Highest Category</p>
            {byCategory.length > 0 ? (
              <>
                <p className="text-2xl font-black">{formatCurrency(Math.max(...byCategory.map(c => c.value)))}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{[...byCategory].sort((a, b) => b.value - a.value)[0]?.name}</p>
              </>
            ) : <p className="text-2xl font-black text-muted-foreground">—</p>}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Last Month</p>
            <p className="text-2xl font-black text-muted-foreground">{formatCurrency(lastMonth)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{format(subMonths(new Date(), 1), "MMMM yyyy")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="md:col-span-3 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">6-Month Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyTrend} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} axisLine={false} tickLine={false} width={55} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Expenses"]} />
                <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <div className="flex gap-3 items-center">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" cx="50%" cy="50%" outerRadius={45} innerRadius={20}>
                      {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {byCategory.slice(0, 5).map(c => (
                    <div key={c.name} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-muted-foreground truncate">{c.name}</span>
                      </div>
                      <span className="font-semibold flex-shrink-0">{formatCurrency(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search description, vehicle, driver…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {vehicleOptions.length > 0 && (
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Vehicle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicleOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {monthOptions.map(m => <SelectItem key={m} value={m}>{format(parseISO(`${m}-01`), "MMMM yyyy")}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button size="sm" variant={sortBy === "date" ? "default" : "outline"} onClick={() => toggleSort("date")} className="h-8 gap-1 text-xs">
            Date {sortBy === "date" && (sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
          </Button>
          <Button size="sm" variant={sortBy === "amount" ? "default" : "outline"} onClick={() => toggleSort("amount")} className="h-8 gap-1 text-xs">
            Amount {sortBy === "amount" && (sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
          </Button>
        </div>
      </div>

      {/* Expense list */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !filtered.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search || catFilter !== "all" || monthFilter !== "all" ? "No expenses match filters" : "No expenses recorded yet"}</p>
            {!search && catFilter === "all" && <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="h-4 w-4" />Add First Expense</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([month, entries]) => {
            const monthTotal = entries.reduce((s, e) => s + Number(e.amount ?? 0), 0);
            return (
              <div key={month}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {month !== "Unknown" ? format(parseISO(`${month}-01`), "MMMM yyyy") : "Unknown Date"}
                  </h3>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(monthTotal)}</span>
                </div>
                <div className="space-y-2">
                  {entries.map(exp => {
                    const cat = CAT_MAP[exp.category ?? "misc"] ?? CAT_MAP.misc;
                    const Icon = cat.icon;
                    return (
                      <Card key={exp.id} className="shadow-sm hover:shadow-md transition-shadow group">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm truncate">{exp.description}</p>
                                <Badge variant="outline" className="text-xs" style={{ borderColor: `${cat.color}40`, color: cat.color, backgroundColor: `${cat.color}10` }}>
                                  {cat.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                {exp.vendorName && (
                                  <span className="text-xs text-muted-foreground">{exp.vendorName}</span>
                                )}
                                {exp.vehicleNumber && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Car className="h-3 w-3" />{exp.vehicleNumber}
                                  </span>
                                )}
                                {exp.driverName && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />{exp.driverName}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {exp.date ? format(parseISO(exp.date), "dd MMM yyyy") : "—"}
                                </span>
                              </div>
                              {exp.notes && (
                                <p className="text-xs text-muted-foreground italic mt-0.5 truncate">{exp.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <p className="font-black text-base" style={{ color: cat.color }}>₹{Number(exp.amount ?? 0).toLocaleString()}</p>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <Button size="sm" variant="ghost" onClick={() => openEdit(exp)} className="h-7 w-7 p-0"><Pencil className="h-3 w-3" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(exp.id, exp.description)} className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dialog?.mode === "create" ? "Record Expense" : "Edit Expense"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Basic */}
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Input value={form.description} onChange={setF("description")} placeholder="e.g. Fuel fill — TN58AB1234" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" value={form.amount} onChange={setF("amount")} placeholder="0" /></div>
              <div className="space-y-1.5"><Label>Vendor / Payee</Label><Input value={form.vendorName} onChange={setF("vendorName")} placeholder="BPCL, Fuel station…" /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={setF("date")} /></div>
            </div>

            {/* Vehicle & Driver */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vehicle & Driver (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vehicle</Label>
                  <Select value={form.vehicleId} onValueChange={handleVehicleSelect}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {(vehicles ?? []).map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.registrationNumber} — {v.make} {v.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Vehicle No. (manual)</Label>
                  <Input value={form.vehicleNumber} onChange={setF("vehicleNumber")} placeholder="TN58AB1234" />
                </div>
                <div className="space-y-1.5">
                  <Label>Driver</Label>
                  <Select value={form.driverId} onValueChange={handleDriverSelect}>
                    <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {(drivers ?? []).map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Driver Name (manual)</Label>
                  <Input value={form.driverName} onChange={setF("driverName")} placeholder="Driver name" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={setF("notes")} placeholder="Additional details…" rows={2} />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createExpense.isPending || updateExpense.isPending}>
                {dialog?.mode === "create" ? "Record Expense" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
