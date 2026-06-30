import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Award, Download, Route, CalendarCheck, TrendingUp, TrendingDown } from "lucide-react";

type SalaryRow = {
  salary: { id: string; driverId: string; month: string; tripsCount: number; presentDays: number; netSalary: string };
  driverName: string | null;
  driverPhone: string | null;
};
type BPRow = { entry: { id: string; driverId: string; type: string; amount: string }; driverName: string | null };

type PerfRow = {
  driverId: string;
  name: string;
  phone: string;
  trips: number;
  presentDays: number;
  netSalary: number;
  bonus: number;
  penalty: number;
  score: number;
};

function downloadCsv(filename: string, rows: string[][], headers: string[]) {
  const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function DriverPerformance() {
  const { data: salaries, isLoading } = useQuery<SalaryRow[]>({
    queryKey: ["/v1/drivers/salary"],
    queryFn: () => api.get("/drivers/salary"),
  });
  const { data: bp } = useQuery<BPRow[]>({
    queryKey: ["/v1/drivers/bonus-penalty"],
    queryFn: () => api.get("/drivers/bonus-penalty"),
  });

  const map = new Map<string, PerfRow>();
  for (const { salary, driverName, driverPhone } of salaries ?? []) {
    const id = salary.driverId;
    const cur = map.get(id) ?? { driverId: id, name: driverName ?? "—", phone: driverPhone ?? "", trips: 0, presentDays: 0, netSalary: 0, bonus: 0, penalty: 0, score: 0 };
    cur.trips += salary.tripsCount ?? 0;
    cur.presentDays += salary.presentDays ?? 0;
    cur.netSalary += Number(salary.netSalary ?? 0);
    map.set(id, cur);
  }
  for (const { entry, driverName } of bp ?? []) {
    const id = entry.driverId;
    const cur = map.get(id) ?? { driverId: id, name: driverName ?? "—", phone: "", trips: 0, presentDays: 0, netSalary: 0, bonus: 0, penalty: 0, score: 0 };
    if (entry.type === "bonus") cur.bonus += Number(entry.amount ?? 0);
    else cur.penalty += Number(entry.amount ?? 0);
    map.set(id, cur);
  }
  const rows = Array.from(map.values()).map(r => ({ ...r, score: r.trips * 10 + r.presentDays * 2 + r.bonus / 100 - r.penalty / 100 }))
    .sort((a, b) => b.score - a.score);

  const totalTrips = rows.reduce((s, r) => s + r.trips, 0);
  const totalPresent = rows.reduce((s, r) => s + r.presentDays, 0);
  const avgTrips = rows.length ? Math.round(totalTrips / rows.length) : 0;
  const topPerformer = rows[0]?.name ?? "—";

  const chartData = rows.slice(0, 10).map(r => ({ name: r.name.split(" ")[0], trips: r.trips }));

  const exportCsv = () => {
    downloadCsv("driver-performance.csv",
      rows.map(r => [r.name, r.phone, String(r.trips), String(r.presentDays), String(r.netSalary), String(r.bonus), String(r.penalty), r.score.toFixed(0)]),
      ["Driver", "Phone", "Trips", "Present Days", "Net Salary", "Bonus", "Penalty", "Score"]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Performance</h1>
          <p className="text-muted-foreground mt-1">Trips, attendance and incentive performance by driver.</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1.5" disabled={!rows.length}><Download className="h-3.5 w-3.5" />Export CSV</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Drivers Tracked</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Trips</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totalTrips}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Trips / Driver</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{avgTrips}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Top Performer</CardTitle></CardHeader><CardContent><p className="text-xl font-bold truncate flex items-center gap-1.5"><Award className="h-5 w-5 text-amber-500" />{topPerformer}</p></CardContent></Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Trips per Driver</CardTitle>
          <CardDescription>Top drivers by completed trips</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64 w-full" /> : chartData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="trips" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-60 flex items-center justify-center text-muted-foreground">No performance data yet</div>}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
          <CardDescription>Per-driver metrics derived from salary and incentive records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-60 w-full" /></div>
          ) : !rows.length ? (
            <div className="text-center py-16"><Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No performance data</p><p className="text-sm text-muted-foreground mt-1">Performance is derived from driver salary and bonus/penalty records.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead><span className="inline-flex items-center gap-1"><Route className="h-3.5 w-3.5" />Trips</span></TableHead>
                  <TableHead><span className="inline-flex items-center gap-1"><CalendarCheck className="h-3.5 w-3.5" />Present</span></TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Penalty</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.driverId}>
                    <TableCell>{i === 0 ? <Award className="h-4 w-4 text-amber-500" /> : <span className="text-muted-foreground">#{i + 1}</span>}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      {r.phone && <div className="text-xs text-muted-foreground">{r.phone}</div>}
                    </TableCell>
                    <TableCell>{r.trips}</TableCell>
                    <TableCell>{r.presentDays}</TableCell>
                    <TableCell>₹{r.netSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-emerald-600 inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" />₹{r.bonus.toLocaleString()}</TableCell>
                    <TableCell className="text-red-500"><span className="inline-flex items-center gap-1"><TrendingDown className="h-3 w-3" />₹{r.penalty.toLocaleString()}</span></TableCell>
                    <TableCell className="text-right"><Badge variant="outline" className="font-semibold">{r.score.toFixed(0)}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
