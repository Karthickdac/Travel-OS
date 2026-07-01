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

const n = (v: any) => Number(v ?? 0) || 0;
const inr = (v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Indian-system number-to-words (rupees)
function amountInWords(num: number): string {
  const rupees = Math.floor(num);
  if (rupees === 0) return "Zero Rupees Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const twoDigits = (x: number): string => {
    if (x < 20) return ones[x];
    return `${tens[Math.floor(x / 10)]}${x % 10 ? " " + ones[x % 10] : ""}`;
  };
  const threeDigits = (x: number): string => {
    const h = Math.floor(x / 100);
    const rest = x % 100;
    return `${h ? ones[h] + " Hundred" + (rest ? " " : "") : ""}${rest ? twoDigits(rest) : ""}`;
  };
  let result = "";
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;
  if (crore) result += `${twoDigits(crore)} Crore `;
  if (lakh) result += `${twoDigits(lakh)} Lakh `;
  if (thousand) result += `${twoDigits(thousand)} Thousand `;
  if (hundred) result += threeDigits(hundred);
  return `${result.trim()} Rupees Only`;
}

// Compute the itemized line breakdown from an invoice-like object
function lineItems(inv: any) {
  return [
    { label: `Hire Charge — ${n(inv.hireHours)} hrs @ ${inr(n(inv.hireHourRate))}/hr`, amount: n(inv.hireHours) * n(inv.hireHourRate) },
    { label: `Hire Charge — ${n(inv.hireKms)} km @ ${inr(n(inv.hireKmRate))}/km`, amount: n(inv.hireKms) * n(inv.hireKmRate) },
    { label: `Day Rent — ${n(inv.rentDays)} day @ ${inr(n(inv.rentDayRate))}/day`, amount: n(inv.rentDays) * n(inv.rentDayRate) },
    { label: `Fuel Charge — ${n(inv.fuelKms)} km @ ${inr(n(inv.fuelKmRate))}/km`, amount: n(inv.fuelKms) * n(inv.fuelKmRate) },
    { label: `Driver Batta — ${n(inv.battaQty)} day/hrs @ ${inr(n(inv.battaRate))}`, amount: n(inv.battaQty) * n(inv.battaRate) },
    { label: "Hills Charge", amount: n(inv.hillsCharge) },
    { label: "Inter State Permit Charge", amount: n(inv.permitCharge) },
    { label: "Toll & Parking", amount: n(inv.tollParking) },
  ].filter((l) => l.amount > 0);
}

function InvoicePrintView({ invoice }: { invoice: any }) {
  const c = invoice.company ?? {};
  const companyName = c.name ?? "Your Company";
  const companyAddress = [c.city, c.country].filter(Boolean).join(", ");
  const items = lineItems(invoice);
  const subtotal = n(invoice.amount);
  const sgstAmount = n(invoice.sgstAmount);
  const cgstAmount = n(invoice.cgstAmount);
  const grandTotal = subtotal + n(invoice.taxAmount);

  return (
    <div className="p-8 bg-white text-black min-h-[700px] font-sans text-sm" id="invoice-print">
      {/* Header */}
      <div className="border-2 border-orange-600 rounded-lg overflow-hidden">
        <div className="flex justify-between items-start p-4 border-b-2 border-orange-600">
          <div className="text-xs text-gray-700">
            {c.gstNumber && <p><span className="font-semibold">GSTIN:</span> {c.gstNumber}</p>}
            <p className="font-bold text-orange-700 mt-0.5">CASH / CREDIT BILL</p>
          </div>
          <div className="text-center flex-1">
            {c.logo && <img src={c.logo} alt="" className="h-10 mx-auto mb-1 object-contain" />}
            <h1 className="text-2xl font-black text-orange-600 uppercase tracking-tight">{companyName}</h1>
            {companyAddress && <p className="text-xs text-gray-600">{companyAddress}</p>}
          </div>
          <div className="text-xs text-gray-700 text-right">
            {c.phone && <p><span className="font-semibold">Mobile:</span> {c.phone}</p>}
            {c.email && <p>{c.email}</p>}
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 p-4 border-b border-orange-300 text-sm">
          <p><span className="font-semibold text-gray-600">Bill No:</span> {invoice.invoiceNumber ?? invoice.id?.slice(0, 8).toUpperCase()}</p>
          <p className="text-right"><span className="font-semibold text-gray-600">Date:</span> {invoice.serviceDate ? format(new Date(invoice.serviceDate), "dd MMM yyyy") : "-"}</p>
          <p className="col-span-2"><span className="font-semibold text-gray-600">Guest Name:</span> {invoice.customerName}{invoice.customerPhone ? ` (${invoice.customerPhone})` : ""}</p>
          <p><span className="font-semibold text-gray-600">From:</span> {invoice.tripFrom ?? "-"}</p>
          <p><span className="font-semibold text-gray-600">To:</span> {invoice.tripTo ?? "-"}</p>
          <p><span className="font-semibold text-gray-600">Vehicle No:</span> {invoice.vehicleNumber ?? "-"}</p>
          <p className="text-right"><span className="font-semibold text-gray-600">Driver:</span> {invoice.driverName ?? "-"}</p>
          {(invoice.startingKm != null || invoice.closingKm != null) && (
            <>
              <p><span className="font-semibold text-gray-600">Starting Km:</span> {invoice.startingKm ?? "-"}</p>
              <p className="text-right"><span className="font-semibold text-gray-600">Closing Km:</span> {invoice.closingKm ?? "-"}</p>
            </>
          )}
        </div>

        {/* Charges table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-orange-300 bg-orange-50">
              <th className="text-left py-2 px-4 text-gray-700 font-semibold">Particulars</th>
              <th className="text-right py-2 px-4 text-gray-700 font-semibold w-40">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr className="border-b border-gray-100"><td className="py-3 px-4 text-gray-500" colSpan={2}>No itemized charges</td></tr>
            ) : items.map((l, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2 px-4">{l.label}</td>
                <td className="py-2 px-4 text-right font-medium">{inr(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-between items-start p-4 border-t border-orange-300">
          <div className="text-xs text-gray-700 max-w-[55%]">
            <p className="font-semibold text-gray-600 mb-1">Rupees (in words):</p>
            <p className="italic">{amountInWords(grandTotal)}</p>
            {invoice.notes && <p className="mt-3 text-gray-500">{invoice.notes}</p>}
          </div>
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Sub Total</span><span className="font-medium">{inr(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">SGST {n(invoice.sgstRate)}%</span><span>{inr(sgstAmount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">CGST {n(invoice.cgstRate)}%</span><span>{inr(cgstAmount)}</span></div>
            <div className="flex justify-between border-t-2 border-orange-600 pt-2 mt-1">
              <span className="font-bold text-base">Grand Total</span>
              <span className="font-black text-lg text-orange-600">{inr(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end p-4 border-t border-orange-300">
          <div>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${invoice.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {invoice.status?.toUpperCase() ?? "PENDING"}
            </span>
            {invoice.paymentMode && <p className="text-xs text-gray-500 mt-1">Mode: {invoice.paymentMode}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">For {companyName}</p>
            <p className="text-xs text-gray-400 mt-6">Authorised Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  customerName: "", customerPhone: "", customerAddress: "",
  vehicleNumber: "", driverName: "",
  tripFrom: "", tripTo: "", kmsTraveled: "", startingKm: "", closingKm: "",
  serviceDate: "", description: "",
  hireHours: "", hireHourRate: "", hireKms: "", hireKmRate: "",
  rentDays: "", rentDayRate: "", fuelKms: "", fuelKmRate: "",
  battaQty: "", battaRate: "", hillsCharge: "", permitCharge: "", tollParking: "",
  sgstRate: "2.5", cgstRate: "2.5", dueDate: "",
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

  const totalPaid = invoices?.filter(i => i.status === "paid").reduce((s, i) => s + n(i.amount) + n(i.taxAmount), 0) ?? 0;
  const totalPending = invoices?.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + n(i.amount) + n(i.taxAmount), 0) ?? 0;

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // Live totals for the form
  const formSubtotal =
    n(form.hireHours) * n(form.hireHourRate) +
    n(form.hireKms) * n(form.hireKmRate) +
    n(form.rentDays) * n(form.rentDayRate) +
    n(form.fuelKms) * n(form.fuelKmRate) +
    n(form.battaQty) * n(form.battaRate) +
    n(form.hillsCharge) + n(form.permitCharge) + n(form.tollParking);
  const formSgst = Math.round(formSubtotal * n(form.sgstRate)) / 100;
  const formCgst = Math.round(formSubtotal * n(form.cgstRate)) / 100;
  const formGrand = formSubtotal + formSgst + formCgst;

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
          startingKm: form.startingKm ? Number(form.startingKm) : undefined,
          closingKm: form.closingKm ? Number(form.closingKm) : undefined,
          serviceDate: form.serviceDate || undefined,
          description: form.description || undefined,
          hireHours: n(form.hireHours),
          hireHourRate: n(form.hireHourRate),
          hireKms: n(form.hireKms),
          hireKmRate: n(form.hireKmRate),
          rentDays: n(form.rentDays),
          rentDayRate: n(form.rentDayRate),
          fuelKms: n(form.fuelKms),
          fuelKmRate: n(form.fuelKmRate),
          battaQty: n(form.battaQty),
          battaRate: n(form.battaRate),
          hillsCharge: n(form.hillsCharge),
          permitCharge: n(form.permitCharge),
          tollParking: n(form.tollParking),
          sgstRate: n(form.sgstRate),
          cgstRate: n(form.cgstRate),
          amount: formSubtotal,
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

  const chargeRow = (label: string, qtyKey: string, qtyPh: string, rateKey: string, ratePh: string) => (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
      <Label className="text-sm">{label}</Label>
      <Input className="w-20" type="number" value={(form as any)[qtyKey]} onChange={setF(qtyKey)} placeholder={qtyPh} />
      <Input className="w-24" type="number" value={(form as any)[rateKey]} onChange={setF(rateKey)} placeholder={ratePh} />
      <span className="w-24 text-right text-sm font-medium text-muted-foreground">{inr(n((form as any)[qtyKey]) * n((form as any)[rateKey]))}</span>
    </div>
  );

  const flatRow = (label: string, key: string) => (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
      <Label className="text-sm">{label}</Label>
      <Input className="w-24" type="number" value={(form as any)[key]} onChange={setF(key)} placeholder="0" />
    </div>
  );

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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Paid</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-emerald-600">₹{totalPaid.toLocaleString("en-IN")}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-amber-600">₹{totalPending.toLocaleString("en-IN")}</p></CardContent></Card>
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
            const total = n(inv.amount) + n(inv.taxAmount);
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
                      <p className="font-black text-lg text-primary">₹{total.toLocaleString("en-IN")}</p>
                      {n(inv.taxAmount) > 0 && (
                        <p className="text-xs text-muted-foreground">Incl. GST ₹{n(inv.taxAmount).toLocaleString("en-IN")}</p>
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
                <div className="space-y-1.5 col-span-2"><Label>Guest Name *</Label><Input value={form.customerName} onChange={setF("customerName")} placeholder="Customer name" /></div>
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
                <div className="space-y-1.5"><Label>Starting Km</Label><Input type="number" value={form.startingKm} onChange={setF("startingKm")} placeholder="0" /></div>
                <div className="space-y-1.5"><Label>Closing Km</Label><Input type="number" value={form.closingKm} onChange={setF("closingKm")} placeholder="0" /></div>
                <div className="space-y-1.5"><Label>Total KMs</Label><Input type="number" value={form.kmsTraveled} onChange={setF("kmsTraveled")} placeholder="0" /></div>
                <div className="space-y-1.5"><Label>Service Date</Label><Input type="date" value={form.serviceDate} onChange={setF("serviceDate")} /></div>
                <div className="space-y-1.5 col-span-2"><Label>Description</Label><Input value={form.description} onChange={setF("description")} placeholder="e.g. Airport pickup, Outstation tour…" /></div>
              </div>
            </div>

            {/* Charges */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Charges</p>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Particulars</span><span className="w-20 text-center">Qty</span><span className="w-24 text-center">Rate</span><span className="w-24 text-right">Amount</span>
              </div>
              <div className="space-y-2">
                {chargeRow("Hire (per hour)", "hireHours", "hrs", "hireHourRate", "₹/hr")}
                {chargeRow("Hire (per km)", "hireKms", "km", "hireKmRate", "₹/km")}
                {chargeRow("Day Rent", "rentDays", "days", "rentDayRate", "₹/day")}
                {chargeRow("Fuel Charge", "fuelKms", "km", "fuelKmRate", "₹/km")}
                {chargeRow("Driver Batta", "battaQty", "day/hr", "battaRate", "₹")}
              </div>
              <div className="space-y-2 mt-3 pt-3 border-t">
                {flatRow("Hills Charge", "hillsCharge")}
                {flatRow("Inter State Permit Charge", "permitCharge")}
                {flatRow("Toll & Parking", "tollParking")}
              </div>
            </div>

            {/* Tax & totals */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tax & Total</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label>SGST (%)</Label><Input type="number" value={form.sgstRate} onChange={setF("sgstRate")} placeholder="2.5" /></div>
                <div className="space-y-1.5"><Label>CGST (%)</Label><Input type="number" value={form.cgstRate} onChange={setF("cgstRate")} placeholder="2.5" /></div>
                <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={setF("dueDate")} /></div>
                <div className="space-y-1.5">
                  <Label>Payment Mode</Label>
                  <Select value={form.paymentMode} onValueChange={v => setForm(f => ({ ...f, paymentMode: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 rounded-md border bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sub Total</span><span className="font-medium">{inr(formSubtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">SGST {n(form.sgstRate)}%</span><span>{inr(formSgst)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CGST {n(form.cgstRate)}%</span><span>{inr(formCgst)}</span></div>
                <div className="flex justify-between border-t pt-1.5 mt-1"><span className="font-bold">Grand Total</span><span className="font-black text-primary">{inr(formGrand)}</span></div>
                <p className="text-xs text-muted-foreground italic pt-1">{amountInWords(formGrand)}</p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes / Remarks</Label>
              <Textarea value={form.notes} onChange={setF("notes")} placeholder="Any additional remarks…" rows={2} />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.customerName || formSubtotal <= 0 || createInvoice.isPending}>
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
