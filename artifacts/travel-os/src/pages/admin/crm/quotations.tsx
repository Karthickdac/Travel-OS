import { useState } from "react";
import { useListQuotations, useCreateQuotation, useUpdateQuotation, useListLeads } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Search, CircleDollarSign, Calendar, ChevronDown, ChevronUp, Trash2, Printer } from "lucide-react";
import { format } from "date-fns";

function QuotationPrintView({ q }: { q: any }) {
  return (
    <div className="p-8 bg-white text-black font-sans min-h-[600px]">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black text-orange-600">Madurai SMT Travels</h1>
          <p className="text-sm text-gray-600">Madurai, Tamil Nadu • 8110806339</p>
          <p className="text-sm text-gray-600">GST: 33AAAAA0000A1Z5</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-gray-800">QUOTATION</p>
          <p className="text-sm text-gray-600 font-mono">{q.quotationNumber}</p>
          {q.validUntil && <p className="text-sm text-gray-600">Valid Until: {format(new Date(q.validUntil), "dd MMM yyyy")}</p>}
        </div>
      </div>
      <div className="border-t border-gray-200 pt-6 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prepared For</p>
        <p className="font-semibold text-lg">{q.customerName}</p>
        {q.customerEmail && <p className="text-sm text-gray-600">{q.customerEmail}</p>}
      </div>
      <table className="w-full mb-6 text-sm">
        <thead><tr className="border-b-2 border-gray-300 bg-gray-50"><th className="text-left py-2 px-2 text-gray-600 font-semibold">Description</th><th className="text-center py-2 px-2 text-gray-600 font-semibold">Qty</th><th className="text-right py-2 px-2 text-gray-600 font-semibold">Unit Price</th><th className="text-right py-2 px-2 text-gray-600 font-semibold">Total</th></tr></thead>
        <tbody>
          {(q.items ?? []).map((item: any, i: number) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2.5 px-2">{item.description}</td>
              <td className="py-2.5 px-2 text-center">{item.quantity}</td>
              <td className="py-2.5 px-2 text-right">₹{Number(item.unitPrice ?? 0).toLocaleString()}</td>
              <td className="py-2.5 px-2 text-right">₹{Number(item.total ?? 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300"><td colSpan={3} className="py-3 px-2 font-bold text-base text-right">Grand Total</td><td className="py-3 px-2 text-right font-black text-lg text-orange-600">₹{Number(q.totalAmount ?? 0).toLocaleString()}</td></tr>
        </tfoot>
      </table>
      {q.notes && (
        <div className="border-t border-gray-200 pt-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Terms & Notes</p>
          <p className="text-sm text-gray-700">{q.notes}</p>
        </div>
      )}
      <div className="border-t border-gray-200 pt-4 text-right text-xs text-gray-500">
        <p>Madurai SMT Travels • 8110806339 • Madurai, Tamil Nadu</p>
        <p className="mt-0.5">This quotation is valid until {q.validUntil ? format(new Date(q.validUntil), "dd MMM yyyy") : "—"}.</p>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-amber-100 text-amber-700 border-amber-200",
};

const EMPTY_ITEM = { description: "", quantity: 1, unitPrice: 0, total: 0 };

export default function AdminQuotations() {
  const { data: quotations, isLoading } = useListQuotations();
  const { data: leads } = useListLeads();
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [updateDialog, setUpdateDialog] = useState<any | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [printQuotation, setPrintQuotation] = useState<any | null>(null);

  const [form, setForm] = useState({
    leadId: "", customerName: "", customerEmail: "",
    validUntil: "", notes: "",
    items: [{ ...EMPTY_ITEM }],
  });
  const [updateStatus, setUpdateStatus] = useState("sent");

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/crm/quotations"] });

  const filtered = (quotations ?? []).filter(q => {
    const s = search.toLowerCase();
    return !search || q.customerName.toLowerCase().includes(s) || q.quotationNumber.toLowerCase().includes(s);
  });

  const totalAmount = form.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);

  const setItem = (idx: number, k: string, val: string | number) => {
    setForm(f => {
      const items = f.items.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [k]: typeof val === "number" ? val : (parseFloat(val as string) || 0) };
        if (k === "quantity" || k === "unitPrice") updated.total = updated.quantity * updated.unitPrice;
        return updated;
      });
      return { ...f, items };
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const handleCreate = async () => {
    if (!form.leadId || !form.customerName || !form.validUntil || form.items.length === 0) {
      toast({ title: "Lead, customer name, validity date, and at least one item are required", variant: "destructive" });
      return;
    }
    try {
      await createQuotation.mutateAsync({ data: {
        leadId: form.leadId, customerName: form.customerName,
        customerEmail: form.customerEmail || undefined,
        validUntil: form.validUntil, notes: form.notes || undefined,
        items: form.items.map(i => ({
          description: i.description || "Service",
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.quantity * i.unitPrice,
        })),
      }});
      toast({ title: "Quotation created" });
      refresh();
      setCreateOpen(false);
      setForm({ leadId: "", customerName: "", customerEmail: "", validUntil: "", notes: "", items: [{ ...EMPTY_ITEM }] });
    } catch { toast({ title: "Failed to create quotation", variant: "destructive" }); }
  };

  const handleStatusUpdate = async () => {
    try {
      await updateQuotation.mutateAsync({ id: updateDialog.id, data: { status: updateStatus } });
      toast({ title: "Quotation status updated" });
      refresh();
      setUpdateDialog(null);
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground mt-1">Create and send travel quotations to leads.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" />New Quotation</Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm flex-wrap">
        {["draft","sent","accepted","rejected"].map(s => (
          <span key={s} className="flex items-center gap-1">
            <span className={`font-semibold ${s === "accepted" ? "text-emerald-600" : s === "rejected" ? "text-red-600" : s === "sent" ? "text-blue-600" : ""}`}>
              {(quotations ?? []).filter(q => q.status === s).length}
            </span>
            <span className="text-muted-foreground">{s}</span>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by customer or quote number…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : !filtered.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search ? "No quotations match" : "No quotations yet"}</p>
            {!search && <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2"><Plus className="h-4 w-4" />New Quotation</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => (
            <Card key={q.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-sm font-semibold">{q.quotationNumber}</p>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[q.status] ?? ""}`}>
                        {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm mt-0.5 font-medium">{q.customerName}</p>
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><CircleDollarSign className="h-3 w-3" />₹{Number(q.totalAmount).toLocaleString()}</span>
                      {q.validUntil && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Valid until {format(new Date(q.validUntil), "MMM d, yyyy")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => setPrintQuotation(q)} className="h-8 text-xs gap-1"><Printer className="h-3 w-3" />Print</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setUpdateStatus(q.status); setUpdateDialog(q); }} className="h-8 text-xs">Update</Button>
                    <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === q.id ? null : q.id)} className="h-8 w-8 p-0">
                      {expanded === q.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {expanded === q.id && q.notes && (
                  <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Notes: </span>{q.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Lead *</Label>
                <Select value={form.leadId} onValueChange={v => {
                  const lead = (leads ?? []).find(l => l.id === v);
                  setForm(f => ({ ...f, leadId: v, customerName: lead?.name ?? f.customerName }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                  <SelectContent>
                    {(leads ?? []).map(l => <SelectItem key={l.id} value={l.id}>{l.name} — {l.phone}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Customer Name *</Label><Input value={form.customerName} onChange={setF("customerName")} /></div>
              <div className="space-y-1.5"><Label>Customer Email</Label><Input type="email" value={form.customerEmail} onChange={setF("customerEmail")} /></div>
              <div className="space-y-1.5"><Label>Valid Until *</Label><Input type="date" value={form.validUntil} onChange={setF("validUntil")} /></div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Line Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-7 text-xs gap-1"><Plus className="h-3 w-3" />Add Item</Button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_80px_110px_auto] gap-2 items-end">
                    <div>
                      {idx === 0 && <p className="text-xs text-muted-foreground mb-1">Description</p>}
                      <Input value={item.description} onChange={e => { const items = [...form.items]; items[idx] = { ...items[idx], description: e.target.value }; setForm(f => ({ ...f, items })); }} placeholder="e.g. Ooty Tour Package" className="text-sm" />
                    </div>
                    <div>
                      {idx === 0 && <p className="text-xs text-muted-foreground mb-1">Qty</p>}
                      <Input type="number" value={item.quantity} onChange={e => setItem(idx, "quantity", e.target.value)} min="1" className="text-sm" />
                    </div>
                    <div>
                      {idx === 0 && <p className="text-xs text-muted-foreground mb-1">Unit Price (₹)</p>}
                      <Input type="number" value={item.unitPrice} onChange={e => setItem(idx, "unitPrice", e.target.value)} className="text-sm" />
                    </div>
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(idx)} className="h-9 w-9 p-0 text-destructive hover:text-destructive mt-auto">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="text-right mt-2 text-sm font-bold">Total: ₹{totalAmount.toLocaleString()}</div>
            </div>

            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={setF("notes")} rows={2} placeholder="Terms, conditions, or special notes…" /></div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createQuotation.isPending}>Create Quotation</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={!!printQuotation} onOpenChange={() => setPrintQuotation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Quotation Preview — {printQuotation?.quotationNumber}</DialogTitle>
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
            </div>
          </DialogHeader>
          {printQuotation && <QuotationPrintView q={printQuotation} />}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!updateDialog} onOpenChange={() => setUpdateDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update — {updateDialog?.quotationNumber}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent to Customer</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUpdateDialog(null)}>Cancel</Button>
              <Button onClick={handleStatusUpdate} disabled={updateQuotation.isPending}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
