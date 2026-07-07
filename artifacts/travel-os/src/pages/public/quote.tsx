import { useState } from "react";
import { useParams } from "wouter";
import { useGetPublicQuotation, useRespondPublicQuotation, getGetPublicQuotationQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  converted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function PublicQuote() {
  const { token } = useParams<{ token: string }>();
  const { data: quote, isLoading, isError } = useGetPublicQuotation(token);
  const respond = useRespondPublicQuotation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [confirm, setConfirm] = useState<"approved" | "rejected" | null>(null);

  const handleRespond = async (action: "approved" | "rejected") => {
    try {
      await respond.mutateAsync({ token, data: { action } });
      qc.invalidateQueries({ queryKey: getGetPublicQuotationQueryKey(token) });
      toast({ title: action === "approved" ? "Quotation accepted" : "Quotation declined" });
    } catch {
      toast({ title: "Failed to submit your response", variant: "destructive" });
    } finally {
      setConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md text-center py-12">
          <CardContent className="space-y-3">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-lg font-semibold">Quotation not found</p>
            <p className="text-sm text-muted-foreground">This link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = quote.validUntil ? new Date(quote.validUntil) < new Date() : false;
  const responded = quote.status === "approved" || quote.status === "rejected" || quote.status === "converted";
  const canRespond = quote.status === "sent" && !isExpired;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Branded header */}
        <div className="flex items-center gap-4">
          {quote.companyLogo ? (
            <img src={quote.companyLogo} alt={quote.companyName} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{quote.companyName}</h1>
            {quote.companyPhone && <p className="text-sm text-muted-foreground">{quote.companyPhone}</p>}
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg">Quotation</CardTitle>
                <p className="font-mono text-sm text-muted-foreground mt-0.5">{quote.quotationNumber}</p>
              </div>
              <Badge variant="outline" className={STATUS_COLORS[quote.status] ?? ""}>
                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Prepared For</p>
              <p className="font-semibold">{quote.customerName}</p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Description</th>
                  <th className="text-center py-2 font-medium">Qty</th>
                  <th className="text-right py-2 font-medium">Unit Price</th>
                  <th className="text-right py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {(quote.items ?? []).map((item, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2.5">{item.description}</td>
                    <td className="py-2.5 text-center">{item.quantity}</td>
                    <td className="py-2.5 text-right">₹{Number(item.unitPrice ?? 0).toLocaleString()}</td>
                    <td className="py-2.5 text-right">₹{Number(item.total ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col items-end gap-1 text-sm">
              {quote.taxAmount > 0 && (
                <div className="flex gap-8"><span className="text-muted-foreground">Tax</span><span>₹{Number(quote.taxAmount).toLocaleString()}</span></div>
              )}
              <div className="flex gap-8 text-base font-bold"><span>Total</span><span className="text-primary">₹{Number(quote.totalAmount).toLocaleString()}</span></div>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Valid until {quote.validUntil ? format(new Date(quote.validUntil), "dd MMM yyyy") : "—"}
            </div>

            {quote.notes && (
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm">{quote.notes}</p>
              </div>
            )}

            {/* Action area */}
            {responded ? (
              <div className="border-t pt-6 text-center space-y-2">
                {quote.status === "rejected" ? (
                  <XCircle className="h-10 w-10 text-red-500 mx-auto" />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                )}
                <p className="font-semibold">
                  {quote.status === "rejected" ? "You declined this quotation" : "Thank you! You accepted this quotation"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {quote.companyName} will be in touch with next steps.
                </p>
              </div>
            ) : isExpired ? (
              <div className="border-t pt-6 text-center">
                <p className="text-sm text-amber-600 font-medium">This quotation has expired. Please contact {quote.companyName} for an updated quote.</p>
              </div>
            ) : canRespond ? (
              <div className="border-t pt-6 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setConfirm("rejected")} disabled={respond.isPending} className="gap-1">
                  <XCircle className="h-4 w-4" />Decline
                </Button>
                <Button onClick={() => setConfirm("approved")} disabled={respond.isPending} className="gap-1">
                  <CheckCircle2 className="h-4 w-4" />Accept
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={o => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "approved" ? "Accept this quotation?" : "Decline this quotation?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "approved"
                ? "By accepting, you confirm you'd like to proceed with this quotation."
                : "Are you sure you want to decline this quotation?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && handleRespond(confirm)}>
              {confirm === "approved" ? "Accept" : "Decline"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
