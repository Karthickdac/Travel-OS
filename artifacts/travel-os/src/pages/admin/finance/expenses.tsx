import { useState } from "react";
import { useListExpenses, useCreateExpense } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Receipt, Plus, Fuel, Wrench, Users, Car, FileText, IndianRupee } from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "fuel", label: "Fuel", icon: Fuel },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
  { value: "salary", label: "Driver Salary", icon: Users },
  { value: "insurance", label: "Insurance", icon: FileText },
  { value: "vehicle_tax", label: "Vehicle Tax", icon: Car },
  { value: "office", label: "Office", icon: IndianRupee },
  { value: "marketing", label: "Marketing", icon: IndianRupee },
  { value: "other", label: "Other", icon: Receipt },
];

const COLORS = ["#f97316", "#0d9488", "#3b82f6", "#8b5cf6", "#ec4899", "#eab308", "#14b8a6", "#6366f1"];

export default function AdminFinanceExpenses() {
  const { data: expenses, isLoading } = useListExpenses();
  const createExpense = useCreateExpense();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ description: "", category: "fuel", amount: "", vendorName: "", date: new Date().toISOString().split("T")[0] });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/finance/expenses"] });

  const filtered = (expenses ?? []).filter(e => {
    const matchSearch = (e.description ?? "").toLowerCase().includes(search.toLowerCase()) || (e.vendorName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount ?? 0), 0) ?? 0;

  const byCategory = CATEGORIES.map((c, i) => ({
    name: c.label,
    value: (expenses ?? []).filter(e => e.category === c.value).reduce((s, e) => s + Number(e.amount ?? 0), 0),
    color: COLORS[i],
  })).filter(c => c.value > 0);

  const handleCreate = async () => {
    try {
      await createExpense.mutateAsync({ data: { description: form.description, category: form.category, amount: Number(form.amount), date: form.date, vendorName: form.vendorName } });
      toast({ title: "Expense recorded" });
      refresh();
      setShowCreate(false);
      setForm({ description: "", category: "fuel", amount: "", vendorName: "", date: new Date().toISOString().split("T")[0] });
    } catch {
      toast({ title: "Error recording expense", variant: "destructive" });
    }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const getCatIcon = (cat: string) => {
    const found = CATEGORIES.find(c => c.value === cat);
    return found?.icon ?? Receipt;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track all business expenses by category.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" />Add Expense</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="shadow-sm h-full">
            <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-3xl font-black text-primary">₹{totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
              </div>
              {byCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={30}>
                        {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {byCategory.map((c) => (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-muted-foreground">{c.name}</span>
                        </div>
                        <span className="font-semibold">₹{c.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="Search expenses…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border border-input rounded-md px-3 py-2 text-sm bg-background">
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : !filtered.length ? (
            <Card className="text-center py-12"><CardContent><Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="font-medium">No expenses found</p><p className="text-sm text-muted-foreground">Record your first expense.</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(exp => {
                const Icon = getCatIcon(exp.category ?? "other");
                const catInfo = CATEGORIES.find(c => c.value === exp.category);
                return (
                  <Card key={exp.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate">{exp.description}</p>
                            <Badge variant="outline" className="text-xs capitalize">{catInfo?.label ?? exp.category}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{exp.vendorName ? `${exp.vendorName} • ` : ""}{exp.date ? format(new Date(exp.date), "dd MMM yyyy") : "—"}</p>
                        </div>
                        <p className="font-black text-primary shrink-0">₹{Number(exp.amount ?? 0).toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label>Description *</Label><Input value={form.description} onChange={setF("description")} placeholder="e.g. Fuel for KL 01 AB 1234" /></div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select value={form.category} onChange={setF("category")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" value={form.amount} onChange={setF("amount")} placeholder="0" /></div>
              <div className="space-y-1.5"><Label>Vendor / Payee</Label><Input value={form.vendorName} onChange={setF("vendorName")} placeholder="Vendor name" /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={setF("date")} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.description || !form.amount}>Add Expense</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
