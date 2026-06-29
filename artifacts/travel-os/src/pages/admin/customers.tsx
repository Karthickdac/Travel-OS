import { useListCustomers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Mail, Phone, MapPin, Star, CircleDollarSign } from "lucide-react";

export default function AdminCustomers() {
  const { data: customers, isLoading } = useListCustomers();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">Your customer database and travel history.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !customers?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No customers yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{c.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                  {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                  {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                  {c.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span>}
                </div>
              </div>
              <div className="text-right space-y-1 flex-shrink-0">
                <div className="text-sm font-semibold flex items-center gap-1 justify-end">
                  <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  ₹{Number(c.totalSpent ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">{c.totalBookings ?? 0} trips</div>
                {c.loyaltyPoints != null && c.loyaltyPoints > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 justify-end">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {c.loyaltyPoints} pts
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
