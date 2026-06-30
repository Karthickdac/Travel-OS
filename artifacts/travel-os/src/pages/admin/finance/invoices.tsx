import { useState } from "react";
import { useListInvoices, useCreateInvoice, useUpdateInvoice, useListVehicles, useListDrivers } from "@workspace/api-client-react";
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
import { FileText, Plus, Printer, CheckCircle2, Clock, AlertCircle, XCircle, Car, User, MapPin, Gauge } from "lucide-react";
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
  const total = Number(invoice.amount ?? 0) + Number(invoice.taxAmount ?? 0);
  return (
    <div className="p-8 bg-white text-black min-h-[700px] font-sans" id="invoice-print">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black text-orange-600">Madurai SMT Travels</h1>
          <p className="text-sm text-gray-600">Madurai, Tamil Nadu</p>
          <p className="text-sm text-gray-600">Ph: 8110806339</p>
          <p className="text-sm text-gray-600">GST: 33AAAAA0000A1Z5</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-gray-800">INVOICE</p>
          <p className="text-sm text-gray-600 font-mono mt-1">#{invoice.invoiceNumber ?? invoice.id?.slice(0, 8).toUpperCase()}</p>
          {invoice.serviceDate && (
            <p className="text-sm text-gray-600">Service Date: {format(new Date(invoice.serviceDate), "dd MMM yyyy")}</p>
          )}
          {invoice.dueDate && (
            <p className="text-sm text-gray-600">Due: {format(new Date(invoice.dueDate), "dd MMM yyyy")}</p>
          )}
        </div>
      </div>

      {/* Customer + Trip Info */}
      <div className="grid grid-cols-2 gap-6 border-t border-gray-200 pt-6 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Billed To</p>
          <p className="font-semibold text-base">{invoice.customerName ?? "Customer"}</p>
          {invoice.customerPhone && <p className="text-sm text-gray-600">📞 {invoice.customerPhone}</p>}
          {invoice.customerAddress && <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{invoice.customerAddress}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trip Details</p>
          {invoice.vehicleNumber && (
            <p className="text-sm text-gray-700"><span className="font-semibold">Vehicle No:</span> {invoice.vehicleNumber}</p>
          )}
          {invoice.driverName && (
            <p className="text-sm text-gray-700"><span className="font-semibold">Driver:</span> {invoice.driverName}</p>
          )}
          {(invoice.tripFrom || invoice.tripTo) && (
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-semibold">Route:</span>{" "}
              {[invoice.tripFrom, invoice.tripTo].filter(Boolean).join(" → ")}
            </p>
          )}
          {invoice.kmsTraveled != null && (
            <p className="text-sm text-gray-700"><span className="font-semibold">Distance:</span> {invoice.kmsTraveled} km</p>
          )}
        </div>
      </div>

      {/* Description */}
      {invoice.description && (
        <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
          <span className="font-semibold">Description: </span>{invoice.description}
        </div>
      )}

      {/* Line items table */}
      <table className="w-full mb-2 text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2 text-gray-600 font-semibold">Description</th>
            <th className="text-right py-2 text-gray-600 font-semibold w-32">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-3">
              {invoice.description ?? "Travel Service"}
              {invoice.kmsTraveled != null && ` — ${invoice.kmsTraveled} km`}
              {(invoice.tripFrom || invoice.tripTo) && (
                <span className="text-gray-500 text-xs block">{[invoice.tripFrom, invoice.tripTo].filter(Boolean).join(" → ")}</span>
              )}
            </td>
            <td className="py-3 text-right font-medium">₹{Number(invoice.amount ?? 0).toLocaleString()}</td>
          </tr>
          {Number(invoice.taxAmount) > 0 && (
            <tr className="border-b border-gray-100">
              <td className="py-2 text-gray-500">GST @ {invoice.taxRate ?? 18}%</td>
              <td className="py-2 text-right">₹{Number(invoice.taxAmount).toLocaleString()}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300">
            <td className="py-3 font-bold text-base">Total Amount</td>
            <td className="py-3 text-right font-black text-xl text-orange-600">₹{total.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      {/* Payment info */}
      <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Payment Status</p>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${invoice.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {invoice.status?.toUpperCase() ?? "PENDING"}
          </span>
          {invoice.paymentMode && <p className="text-xs text-gray-500 mt-1">Mode: {invoice.paymentMode}</p>}
          {invoice.paidAt && <p className="text-xs text-gray-500">Paid on: {format(new Date(invoice.paidAt), "dd MMM yyyy")}</p>}
        </div>
        <div className="text-right text-xs text-gray-500">
          {invoice.notes && <p className="text-gray-600 mb-2 italic max-w-48 text-right">{invoice.notes}</p>}
          <p>Thank you for choosing Madurai SMT Travels!</p>
          <p className="mt-1">📞 8110806339</p>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  customerName: "", customerPhone: "", customerAddress: "",
  vehicleNumber: "", driverName: "",
  tripFrom: "", tripTo: "", kmsTraveled: "",
  serviceDate: "", description: "",
  taxRate: "18", amount: "", taxAmount: "", dueDate: "",
  paymentMode: "", notes: "",
};

export default function AdminFinanceInvoices() {
  const { data: invoices, isLoading } = useListInvoices();
  const { data: vehicles } = useListVehicles();
  const { data: drivers } = useListDrivers();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [printInvoice, setPrintInvoice] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0] });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/finance/invoices"] });

  const filtered = (invoices ?? []).filter(i => {
    const matchSearch = (i.invoiceNumber ?? "").toLowerCase().includes(search.toLowerCase())
      || (i.customerName ?? "").toLowerCase().includes(search.toLowerCase())
      || (i.vehicleNumber ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = invoices?.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount ?? 0), 0) ?? 0;
  const totalPending = invoices?.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + Number(i.amount ?? 0), 0) ?? 0;

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const autoTax = () => {
    const base = Number(form.amount) || 0;
    const rate = Number(form.taxRate) || 18;
    setForm(f => ({ ...f, taxAmount: ((base * rate) / 100).toFixed(2) }));
  };

  const handleCreate = async () => {
    try {
      await createInvoice.mutateAsync({
        data: {
          customerName: form.customerName,
          customerPhone: form.customerPhone || undefined,
          customerAddress: form.customerAddress || undefined,
          vehicleNumber: form.vehicleNumber || undefined,
          driverName: form.driverName || undefined,
          tripFrom: form.tripFrom || undefined,
          tripTo: form.tripTo || undefined,
          kmsTraveled: form.kmsTraveled ? Number(form.kmsTraveled) : undefined,
          serviceDate: form.serviceDate || undefined,
          description: form.description || undefined,
          taxRate: Number(form.taxRate) || 18,
          amount: Number(form.amount),
          taxAmount: Number(form.taxAmount) || 0,
          dueDate: form.dueDate,
          paymentMode: form.paymentMode || undefined,
          notes: form.notes || undefined,
        },
      });
      toast({ title: "Invoice created" });
      refresh();
      setShowCreate(false);
      setForm({ ...EMPTY_FORM, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0] });
    } catch {
      toast({ title: "Error creating invoice", variant: "destructive" });
    }
  };

  const markPaid = async (id: string) => {
    await updateInvoice.mutateAsync({ id, data: { status: "paid" as any } });
    toast({ title: "Invoice marked as paid" });
    refresh();
  };

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
        <Input placeholder="Search by invoice no, customer, vehicle…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <div className="flex gap-2">
          {["all", "draft", "sent", "paid", "overdue"].map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize">{s}</Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : !filtered.length ? (
        <Card className="text-center py-16"><CardContent><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No invoices found</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => {
            const StatusIcon = statusIcons[inv.status ?? "draft"] ?? FileText;
            const total = Number(inv.amount ?? 0) + Number(inv.taxAmount ?? 0);
            return (
              <Card key={inv.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <StatusIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono text-sm font-semibold">{inv.invoiceNumber ?? `INV-${inv.id?.slice(0, 8).toUpperCase()}`}</p>
                          <Badge variant="outline" className={statusColors[inv.status ?? "draft"]}>{inv.status ?? "draft"}</Badge>
                        </div>
                        <p className="text-sm font-medium mt-0.5">{inv.customerName}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {inv.vehicleNumber && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Car className="h-3 w-3" />{inv.vehicleNumber}
                            </span>
                          )}
                          {inv.driverName && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />{inv.driverName}
                            </span>
                          )}
                          {(inv.tripFrom || inv.tripTo) && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {[inv.tripFrom, inv.tripTo].filter(Boolean).join(" → ")}
                            </span>
                          )}
                          {inv.kmsTraveled != null && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Gauge className="h-3 w-3" />{inv.kmsTraveled} km
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-lg text-primary">₹{total.toLocaleString()}</p>
                      {Number(inv.taxAmount) > 0 && (
                        <p className="text-xs text-muted-foreground">Incl. GST ₹{Number(inv.taxAmount).toLocaleString()}</p>
                      )}
                      {inv.dueDate && <p className="text-xs text-muted-foreground">Due {format(new Date(inv.dueDate), "dd MMM")}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => setPrintInvoice(inv)}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
                      {inv.status !== "paid" && (
                        <Button size="sm" variant="ghost" className="text-emerald-700 hover:text-emerald-700" onClick={() => markPaid(inv.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Mark Paid
                        </Button>
                      )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {/* Customer */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Customer Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2"><Label>Customer Name *</Label><Input value={form.customerName} onChange={setF("customerName")} placeholder="Customer name" /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={form.customerPhone} onChange={setF("customerPhone")} placeholder="+91 XXXXX XXXXX" /></div>
                <div className="space-y-1.5"><Label>Address</Label><Input value={form.customerAddress} onChange={setF("customerAddress")} placeholder="City, State" /></div>
              </div>
            </div>

            {/* Vehicle & Driver */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vehicle & Driver</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vehicle</Label>
                  <Select value={form.vehicleNumber} onValueChange={v => setForm(f => ({ ...f, vehicleNumber: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {(vehicles ?? []).map(v => (
                        <SelectItem key={v.id} value={v.registrationNumber}>
                          {v.registrationNumber} — {v.make} {v.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Driver</Label>
                  <Select value={form.driverName} onValueChange={v => setForm(f => ({ ...f, driverName: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {(drivers ?? []).map(d => (
                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Trip */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Trip Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>From</Label><Input value={form.tripFrom} onChange={setF("tripFrom")} placeholder="Pickup location" /></div>
                <div className="space-y-1.5"><Label>To</Label><Input value={form.tripTo} onChange={setF("tripTo")} placeholder="Drop location" /></div>
                <div className="space-y-1.5"><Label>KMs Traveled</Label><Input type="number" value={form.kmsTraveled} onChange={setF("kmsTraveled")} placeholder="0" /></div>
                <div className="space-y-1.5"><Label>Service Date</Label><Input type="date" value={form.serviceDate} onChange={setF("serviceDate")} /></div>
                <div className="space-y-1.5 col-span-2"><Label>Description</Label><Input value={form.description} onChange={setF("description")} placeholder="e.g. Airport pickup, Outstation tour…" /></div>
              </div>
            </div>

            {/* Billing */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Billing</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount (₹) *</Label>
                  <Input type="number" value={form.amount} onChange={setF("amount")} onBlur={autoTax} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>GST Rate (%)</Label>
                  <Input type="number" value={form.taxRate} onChange={setF("taxRate")} onBlur={autoTax} placeholder="18" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tax Amount (₹)</Label>
                  <Input type="number" value={form.taxAmount} onChange={setF("taxAmount")} placeholder="Auto-calculated" />
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.dueDate} onChange={setF("dueDate")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Mode</Label>
                  <Select value={form.paymentMode} onValueChange={v => setForm(f => ({ ...f, paymentMode: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not set</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Total</Label>
                  <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-bold text-primary">
                    ₹{(Number(form.amount || 0) + Number(form.taxAmount || 0)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes / Remarks</Label>
              <Textarea value={form.notes} onChange={setF("notes")} placeholder="Any additional remarks…" rows={2} />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.customerName || !form.amount || createInvoice.isPending}>
                Create Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print dialog */}
      <Dialog open={!!printInvoice} onOpenChange={() => setPrintInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
