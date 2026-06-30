import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { TrendingUp, TrendingDown, IndianRupee, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function months(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}
const MONTHS = months(12);

type PLRow = { month: string; revenue: number; expenses: number; profit: number };

export default function AdminPL() {
  const [period, setPeriod] = useState("6");
  const { data, isLoading } = useQuery<PLRow[]>({
    queryKey: ["/v1/finance/pl", period],
    queryFn: async () => {
      const [invoices, expenses] = await Promise.all([
        api.get<any[]>("/finance/invoices"),
        api.get<any[]>("/finance/expenses"),
      ]);
      const selectedMonths = MONTHS.slice(0, Number(period)).reverse();
      return selectedMonths.map(month => {
        const revenue = (invoices ?? []).filter(inv => inv.issueDate?.startsWith(month) && inv.status === "paid").reduce((s: number, inv: any) => s + parseFloat(inv.amount ?? "0"), 0);
        const exp = (expenses ?? []).filter(e => e.date?.startsWith(month)).reduce((s: number, e: any) => s + parseFloat(e.amount ?? "0"), 0);
        return { month: month.slice(5), revenue, expenses: exp, profit: revenue - exp };
      });
    },
  });

  const totals = (data ?? []).reduce((acc, row) => ({ revenue: acc.revenue + row.revenue, expenses: acc.expenses + row.expenses, profit: acc.profit + row.profit }), { revenue: 0, expenses: 0, profit: 0 });
  const margin = totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profit & Loss</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Revenue vs expenses breakdown</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: totals.revenue, cls: "text-emerald-600", icon: TrendingUp, bg: "bg-emerald-50" },
          { label: "Total Expenses", value: totals.expenses, cls: "text-red-600", icon: TrendingDown, bg: "bg-red-50" },
          { label: "Net Profit", value: totals.profit, cls: totals.profit >= 0 ? "text-emerald-600" : "text-red-600", icon: IndianRupee, bg: "bg-blue-50" },
          { label: "Profit Margin", value: null, display: `${margin}%`, cls: parseFloat(margin) >= 0 ? "text-emerald-600" : "text-red-600", icon: PieChart, bg: "bg-purple-50" },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</CardTitle>
              <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon className="h-4 w-4 text-muted-foreground" /></div>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <p className={`text-2xl font-bold ${s.cls}`}>{s.display ?? `₹${Math.abs(s.value!).toLocaleString()}`}{s.value !== null && s.value! < 0 && " (loss)"}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Monthly Revenue vs Expenses</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-56" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]} />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(142 76% 36%)" radius={[4,4,0,0]} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(0 84% 60%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Monthly Profit / Loss</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-56" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Profit"]} />
                <Bar dataKey="profit" name="Profit" radius={[4,4,0,0]}>
                  {(data ?? []).map((row, i) => <Cell key={i} fill={row.profit >= 0 ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Monthly Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider">
                <th className="px-4 py-3 text-left">Month</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Expenses</th>
                <th className="px-4 py-3 text-right">Profit / Loss</th>
                <th className="px-4 py-3 text-right">Margin</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {isLoading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground"><Skeleton className="h-4 w-full" /></td></tr> :
                  (data ?? []).map(row => {
                    const m = row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={row.month} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold">{row.month}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium">₹{row.revenue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium">₹{row.expenses.toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-bold ${row.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>₹{row.profit.toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-medium ${parseFloat(m) >= 0 ? "text-emerald-600" : "text-red-600"}`}>{m}%</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
