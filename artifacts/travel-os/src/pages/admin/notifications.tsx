import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageSquare, Phone, Plus, Pencil, CheckCircle2, Clock, Send } from "lucide-react";

type Channel = "email" | "sms" | "whatsapp";

interface Template {
  id: string;
  name: string;
  trigger: string;
  channels: Channel[];
  subject?: string;
  body: string;
  active: boolean;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "1", name: "Booking Confirmation", trigger: "booking.confirmed",
    channels: ["email", "sms", "whatsapp"], active: true,
    subject: "Your booking is confirmed – {{booking_number}}",
    body: "Dear {{customer_name}},\n\nYour booking {{booking_number}} is confirmed!\n\nDate: {{trip_date}}\nVehicle: {{vehicle_type}}\nDriver: {{driver_name}} ({{driver_phone}})\n\nThank you for choosing Madurai SMT Travels.\n\nTeam SMT Travels | {{phone}}",
  },
  {
    id: "2", name: "Driver Assigned", trigger: "booking.driver_assigned",
    channels: ["sms", "whatsapp"], active: true,
    body: "Hi {{customer_name}}, your driver {{driver_name}} ({{driver_phone}}) has been assigned for your trip on {{trip_date}}. Vehicle: {{vehicle_number}}. – SMT Travels",
  },
  {
    id: "3", name: "Trip OTP", trigger: "trip.otp_generated",
    channels: ["sms", "whatsapp"], active: true,
    body: "Your trip OTP is {{otp}}. Share this with your driver {{driver_name}} to start the journey. Valid for 10 minutes. – SMT Travels",
  },
  {
    id: "4", name: "Trip Completed + Invoice", trigger: "trip.completed",
    channels: ["email", "whatsapp"], active: true,
    subject: "Trip Completed – Invoice #{{invoice_number}}",
    body: "Dear {{customer_name}},\n\nYour trip has been completed. Please find your invoice attached.\n\nAmount Due: ₹{{amount}}\nPayment Mode: {{payment_mode}}\n\nThank you! – SMT Travels",
  },
  {
    id: "5", name: "Quotation Sent", trigger: "quotation.sent",
    channels: ["email", "whatsapp"], active: true,
    subject: "Your Travel Quotation – {{quotation_number}}",
    body: "Hi {{customer_name}},\n\nPlease find your travel quotation #{{quotation_number}} attached.\n\nTotal: ₹{{amount}}\nValid Until: {{valid_until}}\n\nCall us to confirm: {{phone}} – SMT Travels",
  },
  {
    id: "6", name: "Document Expiry Alert", trigger: "document.expiring",
    channels: ["email"], active: true,
    subject: "Document Expiry Alert – {{document_type}} for {{vehicle_number}}",
    body: "Admin Alert:\n\nThe {{document_type}} for vehicle {{vehicle_number}} expires on {{expiry_date}}.\n\nPlease renew it immediately to avoid compliance issues.\n\nTravelOS ERP",
  },
  {
    id: "7", name: "New Lead Alert", trigger: "lead.created",
    channels: ["email"], active: false,
    subject: "New Enquiry Received – {{lead_name}}",
    body: "A new enquiry has been received:\n\nName: {{lead_name}}\nPhone: {{lead_phone}}\nEnquiry: {{lead_message}}\n\nLog in to your TravelOS dashboard to follow up.",
  },
];

const channelIcon: Record<Channel, any> = { email: Mail, sms: Phone, whatsapp: MessageSquare };
const channelColors: Record<Channel, string> = {
  email: "bg-blue-100 text-blue-700",
  sms: "bg-green-100 text-green-700",
  whatsapp: "bg-emerald-100 text-emerald-700",
};

const triggerLabels: Record<string, string> = {
  "booking.confirmed": "Booking Confirmed",
  "booking.driver_assigned": "Driver Assigned",
  "trip.otp_generated": "Trip OTP Generated",
  "trip.completed": "Trip Completed",
  "quotation.sent": "Quotation Sent",
  "document.expiring": "Document Expiring",
  "lead.created": "New Lead",
};

export default function AdminNotifications() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [selected, setSelected] = useState<Template | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const { toast } = useToast();

  const openEdit = (t: Template) => {
    setSelected(t);
    setEditBody(t.body);
    setEditSubject(t.subject ?? "");
  };

  const saveEdit = () => {
    if (!selected) return;
    setTemplates(ts => ts.map(t => t.id === selected.id ? { ...t, body: editBody, subject: editSubject } : t));
    toast({ title: "Template saved" });
    setSelected(null);
  };

  const toggleActive = (id: string) => {
    setTemplates(ts => ts.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const activeCount = templates.filter(t => t.active).length;

  const VARS = ["{{customer_name}}", "{{booking_number}}", "{{trip_date}}", "{{driver_name}}", "{{driver_phone}}", "{{vehicle_type}}", "{{vehicle_number}}", "{{amount}}", "{{otp}}", "{{phone}}", "{{quotation_number}}", "{{invoice_number}}"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Manage automated notification templates for customers and staff.</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" />New Template</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Templates</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{templates.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{activeCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Inactive</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-muted-foreground">{templates.length - activeCount}</p></CardContent></Card>
      </div>

      {/* Channel status */}
      <div className="grid grid-cols-3 gap-4">
        {(["email", "sms", "whatsapp"] as Channel[]).map(ch => {
          const Icon = channelIcon[ch];
          return (
            <Card key={ch}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <CardTitle className="text-sm capitalize">{ch === "whatsapp" ? "WhatsApp" : ch.toUpperCase()}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-xs text-muted-foreground">Configure in Settings → Notifications</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Templates list */}
      <div className="space-y-3">
        {templates.map(t => (
          <Card key={t.id} className={`shadow-sm transition-opacity ${t.active ? "" : "opacity-60"}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${t.active ? "bg-primary/10" : "bg-muted"}`}>
                    <Bell className={`h-4 w-4 ${t.active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm">{t.name}</p>
                      <Badge variant="outline" className="text-xs">{triggerLabels[t.trigger] ?? t.trigger}</Badge>
                      {t.active ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs"><Clock className="h-3 w-3 mr-1" />Inactive</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {t.channels.map(ch => {
                        const Icon = channelIcon[ch];
                        return <span key={ch} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${channelColors[ch]}`}><Icon className="h-3 w-3" />{ch === "whatsapp" ? "WhatsApp" : ch.toUpperCase()}</span>;
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 font-mono bg-muted/50 rounded px-2 py-1">{t.body.substring(0, 120)}…</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(t.id)}>
                    {t.active ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Template: {selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.channels.includes("email") && (
                <div className="space-y-1.5">
                  <Label>Email Subject</Label>
                  <Input value={editSubject} onChange={e => setEditSubject(e.target.value)} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Message Body</Label>
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  rows={10}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm font-mono bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Available Variables</p>
                <div className="flex flex-wrap gap-1.5">
                  {VARS.map(v => <code key={v} className="text-xs bg-background border border-border rounded px-1.5 py-0.5 cursor-pointer" onClick={() => setEditBody(b => b + v)}>{v}</code>)}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                <Button variant="outline" className="gap-2"><Send className="h-4 w-4" />Test Send</Button>
                <Button onClick={saveEdit}>Save Template</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
