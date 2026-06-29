import { useListLeads } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Phone, MapPin, CircleDollarSign, Calendar } from "lucide-react";

const stageColors: Record<string, string> = {
  new: "bg-gray-100 text-gray-700 border-gray-200",
  contacted: "bg-blue-100 text-blue-700 border-blue-200",
  qualified: "bg-purple-100 text-purple-700 border-purple-200",
  won: "bg-emerald-100 text-emerald-700 border-emerald-200",
  lost: "bg-red-100 text-red-700 border-red-200",
};

const sourceLabel: Record<string, string> = {
  website: "Website",
  phone: "Phone",
  email: "Email",
  referral: "Referral",
  whatsapp: "WhatsApp",
  social: "Social Media",
};

export default function AdminLeads() {
  const { data: leads, isLoading } = useListLeads();

  const grouped = leads ? {
    new: leads.filter(l => l.status === "new"),
    contacted: leads.filter(l => l.status === "contacted"),
    qualified: leads.filter(l => l.status === "qualified"),
    won: leads.filter(l => l.status === "won"),
    lost: leads.filter(l => l.status === "lost"),
  } : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads Pipeline</h1>
        <p className="text-muted-foreground mt-1">Track and convert travel enquiries.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !leads?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No leads yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {lead.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{lead.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${stageColors[lead.status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </span>
                  {lead.source && (
                    <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
                      {sourceLabel[lead.source] ?? lead.source}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                  {lead.destination && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.destination}</span>}
                  {lead.budget && <span className="flex items-center gap-1"><CircleDollarSign className="h-3 w-3" />₹{Number(lead.budget).toLocaleString()}</span>}
                  {lead.travelDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{lead.travelDate}</span>}
                  {lead.pax && <span>{lead.pax} pax</span>}
                </div>
                {lead.notes && <p className="text-xs text-muted-foreground mt-2 italic truncate">{lead.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
