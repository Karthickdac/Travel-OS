import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Smartphone, MapPin, CreditCard, Code2, Save, Plug, Cookie, Star } from "lucide-react";

type CompanySettings = {
  id: string;
  whatsappToken?: string | null;
  smsGatewayKey?: string | null;
  googleMapsKey?: string | null;
  googlePlaceId?: string | null;
  razorpayKeyId?: string | null;
  stripePublishableKey?: string | null;
  customCss?: string | null;
  customJs?: string | null;
  cookieConsentText?: string | null;
};

type IntegrationField = {
  key: keyof CompanySettings;
  label: string;
  icon: typeof MessageSquare;
  description: string;
  placeholder: string;
};

const INTEGRATIONS: IntegrationField[] = [
  { key: "whatsappToken", label: "WhatsApp Business API Token", icon: MessageSquare, description: "Send booking confirmations & alerts to customers over WhatsApp.", placeholder: "EAAG..." },
  { key: "smsGatewayKey", label: "SMS Gateway API Key", icon: Smartphone, description: "Deliver transactional SMS (OTP, trip updates) via your SMS provider.", placeholder: "sms_live_..." },
  { key: "googleMapsKey", label: "Google Maps API Key", icon: MapPin, description: "Power route maps, distance estimates, pickup locations and Google reviews. Needs the Places API enabled in Google Cloud.", placeholder: "AIza..." },
  { key: "googlePlaceId", label: "Google Business Place ID", icon: Star, description: "Show your Google Business rating & reviews on your website. Find your Place ID at developers.google.com/maps/documentation/places/web-service/place-id (search your business name).", placeholder: "ChIJ..." },
  { key: "razorpayKeyId", label: "Razorpay Key ID", icon: CreditCard, description: "Accept online payments from customers in India via Razorpay.", placeholder: "rzp_live_..." },
  { key: "stripePublishableKey", label: "Stripe Publishable Key", icon: CreditCard, description: "Accept international card payments via Stripe.", placeholder: "pk_live_..." },
];

export default function AdminSettingsIntegrations() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<CompanySettings>({
    queryKey: ["/v1/company/settings"],
    queryFn: () => api.get("/company/settings"),
  });

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      setForm({
        whatsappToken: settings.whatsappToken ?? "",
        smsGatewayKey: settings.smsGatewayKey ?? "",
        googleMapsKey: settings.googleMapsKey ?? "",
        googlePlaceId: settings.googlePlaceId ?? "",
        razorpayKeyId: settings.razorpayKeyId ?? "",
        stripePublishableKey: settings.stripePublishableKey ?? "",
        customCss: settings.customCss ?? "",
        customJs: settings.customJs ?? "",
        cookieConsentText: settings.cookieConsentText ?? "",
      });
    }
  }, [settings]);

  const updateMut = useMutation({
    mutationFn: (d: Record<string, string>) => api.put("/company/settings", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/v1/company/settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (e: any) => toast({ title: e.message ?? "Failed to save", variant: "destructive" }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const saveIntegrations = () => {
    updateMut.mutate({
      whatsappToken: form.whatsappToken ?? "",
      smsGatewayKey: form.smsGatewayKey ?? "",
      googleMapsKey: form.googleMapsKey ?? "",
      googlePlaceId: form.googlePlaceId ?? "",
      razorpayKeyId: form.razorpayKeyId ?? "",
      stripePublishableKey: form.stripePublishableKey ?? "",
    });
  };

  const saveCustomCode = () => {
    updateMut.mutate({
      customCss: form.customCss ?? "",
      customJs: form.customJs ?? "",
      cookieConsentText: form.cookieConsentText ?? "",
    });
  };

  const configuredCount = INTEGRATIONS.filter((i) => (form[i.key as string] ?? "").trim().length > 0).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations & Custom Code</h1>
        <p className="text-muted-foreground mt-1">Connect third-party services and inject custom styling or scripts into your website.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="integrations" className="gap-2"><Plug className="h-4 w-4" />Integrations</TabsTrigger>
            <TabsTrigger value="custom-code" className="gap-2"><Code2 className="h-4 w-4" />Custom Code</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Integrations</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{INTEGRATIONS.length}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Configured</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{configuredCount}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Not Configured</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-gray-500">{INTEGRATIONS.length - configuredCount}</p></CardContent></Card>
            </div>

            <div className="grid gap-4">
              {INTEGRATIONS.map((field) => {
                const Icon = field.icon;
                const configured = (form[field.key as string] ?? "").trim().length > 0;
                return (
                  <Card key={field.key as string} className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
                          <div>
                            <CardTitle className="text-base">{field.label}</CardTitle>
                            <CardDescription className="mt-0.5">{field.description}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className={configured ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600"}>
                          {configured ? "Configured" : "Not configured"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1.5">
                        <Label>{field.label}</Label>
                        <Input
                          type="password"
                          value={form[field.key as string] ?? ""}
                          onChange={set(field.key as string)}
                          placeholder={field.placeholder}
                          autoComplete="off"
                          className="font-mono"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={saveIntegrations} disabled={updateMut.isPending} className="gap-2">
                <Save className="h-4 w-4" />Save Integrations
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="custom-code" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary"><Code2 className="h-5 w-5" /></div>
                  <div>
                    <CardTitle className="text-base">Custom CSS</CardTitle>
                    <CardDescription className="mt-0.5">Inject custom styles into your public website. Applied globally.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.customCss ?? ""}
                  onChange={set("customCss")}
                  placeholder={".hero { background: #f97316; }"}
                  className="font-mono text-sm min-h-[160px]"
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary"><Code2 className="h-5 w-5" /></div>
                  <div>
                    <CardTitle className="text-base">Custom JavaScript</CardTitle>
                    <CardDescription className="mt-0.5">Add tracking pixels, chat widgets or analytics scripts. Use with care.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.customJs ?? ""}
                  onChange={set("customJs")}
                  placeholder={"console.log('Hello from TravelOS');"}
                  className="font-mono text-sm min-h-[160px]"
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary"><Cookie className="h-5 w-5" /></div>
                  <div>
                    <CardTitle className="text-base">Cookie Consent Text</CardTitle>
                    <CardDescription className="mt-0.5">Banner message shown to visitors for cookie/privacy consent.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <Label>Consent Message</Label>
                  <Input
                    value={form.cookieConsentText ?? ""}
                    onChange={set("cookieConsentText")}
                    placeholder="We use cookies to improve your experience. By using our site you accept our cookie policy."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-2">
              <Button onClick={saveCustomCode} disabled={updateMut.isPending} className="gap-2">
                <Save className="h-4 w-4" />Save Custom Code
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
