import { useState } from "react";
import { useListInvoices, useCreateInvoice, useUpdateInvoice } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Printer, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const statusIcons: Record<string, any> = {
  draft: Clock, sent: FileText, paid: CheckCircle2, overdue: AlertCircle, cancelled: XCircle,
};

function InvoicePrintView({ invoice }: { invoice: any }) {
  return (
    <div className="p-8 bg-white text-black min-h-[600px] font-sans" id="invoice-print">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black text-orange-600">Madurai SMT Travels</h1>
          <p className="text-sm text-gray-600">Madurai, Tamil Nadu • 8110806339</p>
          <p className="text-sm text-gray-600">GST: 33AAAAA0000A1Z5</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-gray-800">INVOICE</p>
          <p className="text-sm text-gray-600 font-mono">#{invoice.invoiceNumber ?? invoice.id?.slice(0, 8).toUpperCase()}</p>
          <p className="text-sm text-gray-600">Date: {invoice.issueDate ? format(new Date(invoice.issueDate), "dd MMM yyyy") : "—"}</p>
          {invoice.dueDate && <p className="text-sm text-gray-600">Due: {format(new Date(invoice.dueDate), "dd MMM yyyy")}</p>}
        </div>
      </div>
      <div className="border-t border-gray-200 pt-6 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Billed To</p>
        <p className="font-semibold">{invoice.customerName ?? "Customer"}</p>
        {invoice.customerPhone && <p className="text-sm text-gray-600">{invoice.customerPhone}</p>}
      </div>
      <table className="w-full mb-6 text-sm">
        <thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-gray-600 font-semibold">Description</th><th className="text-right py-2 text-gray-600 font-semibold">Amount</th></tr></thead>
        <tbody>
          <tr className="border-b border-gray-100"><td className="py-3">{invoice.description ?? "Travel Service"}</td><td className="py-3 text-right">₹{Number(invoice.amount ?? 0).toLocaleString()}</td></tr>
          {invoice.taxAmount && <tr className="border-b border-gray-100"><td className="py-3 text-gray-500">GST ({invoice.taxRate ?? 18}%)</td><td className="py-3 text-right">₹{Number(invoice.taxAmount).toLocaleString()}</td></tr>}
        </tbody>
        <tfoot>
          <tr><td className="py-3 font-bold text-base">Total</td><td className="py-3 text-right font-black text-lg text-orange-600">₹{Number(invoice.totalAmount ?? invoice.amount ?? 0).toLocaleString()}</td></tr>
        </tfoot>
      </table>
      <div className="border-t border-gray-200 pt-4 flex justify-between items-end">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Payment Status</p>
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${invoice.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{invoice.status?.toUpperCase() ?? "PENDING"}</span>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Thank you for your business!</p>
          <p className="mt-1">Madurai SMT Travels • 8110806339</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinanceInvoices() {
  const { data: invoices, isLoading } = useListInvoices();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [printInvoice, setPrintInvoice] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customerName: "", amount: "", dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0] });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/finance/invoices"] });

  const filtered = (invoices ?? []).filter(i => {
    const matchSearch = (i.invoiceNumber ?? "").toLowerCase().includes(search.toLowerCase()) || (i.customerName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = invoices?.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount ?? 0), 0) ?? 0;
  const totalPending = invoices?.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + Number(i.amount ?? 0), 0) ?? 0;

  const handleCreate = async () => {
    try {
      await createInvoice.mutateAsync({ data: { customerName: form.customerName, amount: Number(form.amount), dueDate: form.dueDate } });
      toast({ title: "Invoice created" });
      refresh();
      setShowCreate(false);
      setForm({ customerName: "", amount: "", dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0] });
    } catch {
      toast({ title: "Error creating invoice", variant: "destructive" });
    }
  };

  const markPaid = async (id: string) => {
    await updateInvoice.mutateAsync({ id, data: { status: "paid" as any } });
    toast({ title: "Invoice marked as paid" });
    refresh();
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Generate, send, and track all invoices.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" />New Invoice</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Invoices</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{invoices?.length ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Paid</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-emerald-600">₹{totalPaid.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-amber-600">₹{totalPending.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">{invoices?.filter(i => i.status === "overdue").length ?? 0}</p></CardContent></Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <div className="flex gap-2">
          {["all", "draft", "sent", "paid", "overdue"].map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize">{s}</Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : !filtered.length ? (
        <Card className="text-center py-16"><CardContent><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No invoices found</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => {
            const StatusIcon = statusIcons[inv.status ?? "draft"] ?? FileText;
            return (
              <Card key={inv.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <StatusIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono text-sm font-semibold">{inv.invoiceNumber ?? `INV-${inv.id?.slice(0, 8).toUpperCase()}`}</p>
                          <Badge variant="outline" className={statusColors[inv.status ?? "draft"]}>{inv.status ?? "draft"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{inv.customerName} • {inv.createdAt ? format(new Date(inv.createdAt), "dd MMM yyyy") : "—"}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-lg text-primary">₹{Number(inv.amount ?? 0).toLocaleString()}</p>
                      {inv.dueDate && <p className="text-xs text-muted-foreground">Due {format(new Date(inv.dueDate), "dd MMM")}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => setPrintInvoice(inv)}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
                      {inv.status !== "paid" && <Button size="sm" variant="ghost" className="text-emerald-700 hover:text-emerald-700" onClick={() => markPaid(inv.id)}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Mark Paid</Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create invoice dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Customer Name *</Label><Input value={form.customerName} onChange={setF("customerName")} placeholder="Customer name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" value={form.amount} onChange={setF("amount")} placeholder="0" /></div>
              <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={setF("dueDate")} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.customerName || !form.amount}>Create Invoice</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print dialog */}
      <Dialog open={!!printInvoice} onOpenChange={() => setPrintInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Invoice Preview</DialogTitle>
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
            </div>
          </DialogHeader>
          {printInvoice && <InvoicePrintView invoice={printInvoice} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
