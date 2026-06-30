import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, IndianRupee, Receipt, FileText, Percent } from "lucide-react";

type GstRow = { month: string; taxable: number; gst: number; total: number; count: number };

function downloadCsv(filename: string, rows: string[][], headers: string[]) {
  const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return isNaN(d.getTime()) ? m : d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function StatCard({ title, value, sub, icon: Icon }: { title: string; value: string | number; sub?: string; icon: any }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs mt-1 text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminFinanceGst() {
  const { data, isLoading } = useQuery<GstRow[]>({
    queryKey: ["/v1/finance/gst-summary"],
    queryFn: () => api.get("/finance/gst-summary"),
  });

  const rows = data ?? [];
  const totalTaxable = rows.reduce((s, r) => s + Number(r.taxable ?? 0), 0);
  const totalGst = rows.reduce((s, r) => s + Number(r.gst ?? 0), 0);
  const totalInvoices = rows.reduce((s, r) => s + Number(r.count ?? 0), 0);

  const chartData = [...rows].sort((a, b) => a.month.localeCompare(b.month)).map(r => ({ month: monthLabel(r.month), gst: Number(r.gst ?? 0) }));

  const exportCsv = () => {
    const csvRows = rows.map(r => [r.month, String(r.taxable), String(r.gst), String(r.total), String(r.count)]);
    downloadCsv("gst-summary.csv", csvRows, ["Month", "Taxable", "GST", "Total", "Invoices"]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GST Report</h1>
          <p className="text-muted-foreground mt-1">Monthly GST collected and taxable turnover.</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1.5" disabled={!rows.length}>
          <Download className="h-3.5 w-3.5" />Download CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Taxable" value={`₹${totalTaxable.toLocaleString()}`} sub="Taxable turnover" icon={IndianRupee} />
        <StatCard title="Total GST Collected" value={`₹${totalGst.toLocaleString()}`} sub="Across all months" icon={Percent} />
        <StatCard title="Total Invoices" value={totalInvoices} sub={`${rows.length} months`} icon={FileText} />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Monthly GST</CardTitle>
          <CardDescription>GST collected per month</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">No GST data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "GST"]} />
                <Bar dataKey="gst" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Breakdown by Month</CardTitle>
          <CardDescription>Taxable value, GST and invoice counts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !rows.length ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No GST records</p>
              <p className="text-sm text-muted-foreground mt-1">GST is derived from issued invoices.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Taxable</TableHead>
                  <TableHead className="text-right">GST</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.month}>
                    <TableCell className="font-medium">{monthLabel(r.month)}</TableCell>
                    <TableCell className="text-right">₹{Number(r.taxable ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{Number(r.gst ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">₹{Number(r.total ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.count}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">₹{totalTaxable.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{totalGst.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{(totalTaxable + totalGst).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{totalInvoices}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
