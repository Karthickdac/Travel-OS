import { useListInvoices, useListExpenses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, TrendingDown, FileText, CircleDollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

const invoiceStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function AdminFinanceSummary() {
  const { data: invoices, isLoading: inv_loading } = useListInvoices();
  const { data: expenses, isLoading: exp_loading } = useListExpenses();
  const isLoading = inv_loading || exp_loading;

  const totalInvoiced = invoices?.reduce((s, i) => s + Number(i.amount ?? 0), 0) ?? 0;
  const totalPaid = invoices?.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount ?? 0), 0) ?? 0;
  const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount ?? 0), 0) ?? 0;
  const netProfit = totalPaid - totalExpenses;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Summary</h1>
        <p className="text-muted-foreground mt-1">Revenue, invoices, and expense overview.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{totalInvoiced.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{invoices?.length ?? 0} invoices</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Amount Collected</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">₹{totalPaid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Paid invoices</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{expenses?.length ?? 0} entries</p>
              </CardContent>
            </Card>

            <Card className={`shadow-sm ${netProfit >= 0 ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/40"}`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <Wallet className={`h-4 w-4 ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`} />
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  ₹{Math.abs(netProfit).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{netProfit >= 0 ? "Profit" : "Loss"}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!invoices?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No invoices</p>
                ) : invoices.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inv.customerName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono">{inv.invoiceNumber}</span>
                        {inv.dueDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(inv.dueDate), "MMM d")}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-semibold">₹{Number(inv.amount).toLocaleString()}</p>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mt-0.5 ${invoiceStatusColors[inv.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!expenses?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No expenses</p>
                ) : expenses.slice(0, 5).map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate capitalize">{exp.category}</p>
                      {exp.description && <p className="text-xs text-muted-foreground truncate">{exp.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-semibold text-red-600">₹{Number(exp.amount).toLocaleString()}</p>
                      {exp.date && <p className="text-xs text-muted-foreground">{format(new Date(exp.date), "MMM d")}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
