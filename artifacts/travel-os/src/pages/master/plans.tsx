import { useListPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Check, Users, Car, Calendar } from "lucide-react";

export default function MasterPlans() {
  const { data: plans, isLoading } = useListPlans();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
        <p className="text-muted-foreground mt-1">Manage and configure SaaS subscription tiers.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 w-full rounded-lg" />)}
        </div>
      ) : !plans?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No plans configured</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <Card key={plan.id} className={`shadow-sm relative overflow-hidden ${i === 1 ? 'border-primary border-2 shadow-primary/10' : ''}`}>
              {i === 1 && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Popular
                </div>
              )}
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-extrabold text-foreground">₹{Number(plan.price).toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm"> / {plan.duration} days</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Up to <strong className="text-foreground">{plan.maxUsers}</strong> users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Up to <strong className="text-foreground">{plan.maxVehicles}</strong> vehicles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    <span><strong className="text-foreground">{plan.maxBookingsPerMonth}</strong> bookings/month</span>
                  </div>
                </div>
                {plan.features && plan.features.length > 0 && (
                  <div className="border-t border-border pt-4 space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
