import { useListQuotations } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CircleDollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-amber-100 text-amber-700",
};

export default function AdminQuotations() {
  const { data: quotations, isLoading } = useListQuotations();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
        <p className="text-muted-foreground mt-1">Track all customer quotations and proposals.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !quotations?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No quotations yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quotations.map((q) => (
            <div key={q.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{q.customerName}</p>
                  <span className="font-mono text-xs text-muted-foreground">{q.quotationNumber}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[q.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                  </span>
                </div>
                {q.description && <p className="text-xs text-muted-foreground mt-1 truncate">{q.description}</p>}
              </div>
              <div className="text-right flex-shrink-0 space-y-1">
                <div className="font-semibold text-sm flex items-center gap-1 justify-end">
                  <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  ₹{Number(q.totalAmount).toLocaleString()}
                </div>
                {q.validUntil && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(q.validUntil), "MMM d, yyyy")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
