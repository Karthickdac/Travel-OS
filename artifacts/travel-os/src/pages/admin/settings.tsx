import { useState, useEffect } from "react";
import { useGetCompany, useUpdateCompany } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Building2, Palette, Bell, CreditCard, Globe, Lock, Save, Mail, Phone } from "lucide-react";

const tabs = [
  { id: "company", label: "Company Profile", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "payments", label: "Payment Gateway", icon: CreditCard },
  { id: "domain", label: "Custom Domain", icon: Globe },
  { id: "security", label: "Security", icon: Lock },
];

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div><p className="font-semibold text-base">{title}</p>{desc && <p className="text-sm text-muted-foreground">{desc}</p>}</div>
      <Separator />
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-start">
      <div><Label className="text-sm font-medium">{label}</Label>{hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}</div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");

  const companyId = user?.companyId ?? "";
  const { data: companyData } = useGetCompany(companyId, { query: { enabled: !!companyId } as any });
  const updateCompany = useUpdateCompany();

  const [company, setCompany] = useState({
    name: "Madurai SMT Travels",
    email: "admin@maduraismt.com",
    phone: "8110806339",
    city: "Madurai, Tamil Nadu",
    gstNumber: "33AAAAA0000A1Z5",
    domain: "https://maduraismt.com",
  });

  useEffect(() => {
    if (companyData) {
      setCompany({
        name: companyData.name ?? "Madurai SMT Travels",
        email: companyData.email ?? "",
        phone: companyData.phone ?? "8110806339",
        city: companyData.city ?? "Madurai, Tamil Nadu",
        gstNumber: companyData.gstNumber ?? "33AAAAA0000A1Z5",
        domain: companyData.domain ?? "",
      });
    }
  }, [companyData]);

  const [branding, setBranding] = useState({
    primaryColor: "#f97316",
    secondaryColor: "#0d9488",
    tagline: "Safe • Comfortable • Reliable",
    logoUrl: "",
    faviconUrl: "",
  });

  const [smtp, setSmtp] = useState({
    host: "", port: "587", user: "", fromName: "Madurai SMT Travels", fromEmail: "",
  });

  const [payments, setPayments] = useState({
    razorpayKeyId: "", razorpayKeySecret: "", stripePublishableKey: "", stripeSecretKey: "",
  });

  const [domain, setDomain] = useState({ customDomain: "", sslStatus: "pending" });

  const save = async () => {
    if (activeTab === "company" && companyId) {
      try {
        await updateCompany.mutateAsync({ id: companyId, data: { name: company.name, email: company.email, phone: company.phone, city: company.city, domain: company.domain } });
        toast({ title: "Company profile saved" });
      } catch {
        toast({ title: "Failed to save", variant: "destructive" });
      }
    } else {
      toast({ title: "Settings saved successfully" });
    }
  };

  const setC = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setCompany(f => ({ ...f, [k]: e.target.value }));
  const setB = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setBranding(f => ({ ...f, [k]: e.target.value }));
  const setS = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setSmtp(f => ({ ...f, [k]: e.target.value }));
  const setP = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setPayments(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your company profile, branding, and integrations.</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-8">
              {activeTab === "company" && (
                <>
                  <Section title="Company Profile" desc="Basic information about your travel company.">
                    <Field label="Company Name"><Input value={company.name} onChange={setC("name")} /></Field>
                    <Field label="Contact Email"><Input type="email" value={company.email} onChange={setC("email")} /></Field>
                    <Field label="Contact Phone"><Input value={company.phone} onChange={setC("phone")} /></Field>
                    <Field label="City / Address"><Input value={company.city} onChange={setC("city")} /></Field>
                    <Field label="GST Number" hint="GST identification number"><Input value={company.gstNumber} onChange={setC("gstNumber")} placeholder="33AAAAA0000A1Z5" /></Field>
                    <Field label="Domain / Website"><Input value={company.domain} onChange={setC("domain")} placeholder="https://yourcompany.com" /></Field>
                  </Section>
                  <Section title="Logged-in User" desc="Your current admin account.">
                    <Field label="Name"><Input value={user?.name ?? ""} readOnly className="bg-muted" /></Field>
                    <Field label="Email"><Input value={user?.email ?? ""} readOnly className="bg-muted" /></Field>
                    <Field label="Role"><Input value={user?.role ?? ""} readOnly className="bg-muted" /></Field>
                  </Section>
                </>
              )}

              {activeTab === "branding" && (
                <Section title="Brand Identity" desc="Customise colours, logo, and tagline for your customer website.">
                  <Field label="Primary Colour" hint="Main brand colour (buttons, accents)">
                    <div className="flex gap-2"><input type="color" value={branding.primaryColor} onChange={setB("primaryColor")} className="h-10 w-14 rounded-md border border-input cursor-pointer" /><Input value={branding.primaryColor} onChange={setB("primaryColor")} className="font-mono" /></div>
                  </Field>
                  <Field label="Secondary Colour" hint="Sidebar and accent colour">
                    <div className="flex gap-2"><input type="color" value={branding.secondaryColor} onChange={setB("secondaryColor")} className="h-10 w-14 rounded-md border border-input cursor-pointer" /><Input value={branding.secondaryColor} onChange={setB("secondaryColor")} className="font-mono" /></div>
                  </Field>
                  <Field label="Tagline"><Input value={branding.tagline} onChange={setB("tagline")} placeholder="Your company slogan" /></Field>
                  <Field label="Logo" hint="Upload your logo image"><ImageUpload value={branding.logoUrl} onChange={url => setBranding(f => ({ ...f, logoUrl: url }))} previewClassName="h-12 w-20 bg-white" accept="image/*,.svg" /></Field>
                  <Field label="Favicon"><ImageUpload value={branding.faviconUrl} onChange={url => setBranding(f => ({ ...f, faviconUrl: url }))} previewClassName="h-10 w-10" accept="image/*,.ico,.svg" /></Field>
                </Section>
              )}

              {activeTab === "notifications" && (
                <Section title="Email / SMTP Configuration" desc="Configure your outgoing email server for booking confirmations and alerts.">
                  <Field label="SMTP Host"><Input value={smtp.host} onChange={setS("host")} placeholder="smtp.gmail.com" /></Field>
                  <Field label="SMTP Port"><Input value={smtp.port} onChange={setS("port")} placeholder="587" /></Field>
                  <Field label="SMTP Username"><Input value={smtp.user} onChange={setS("user")} placeholder="you@example.com" /></Field>
                  <Field label="SMTP Password"><Input type="password" placeholder="••••••••" /></Field>
                  <Field label="From Name"><Input value={smtp.fromName} onChange={setS("fromName")} placeholder="Madurai SMT Travels" /></Field>
                  <Field label="From Email"><Input type="email" value={smtp.fromEmail} onChange={setS("fromEmail")} placeholder="noreply@maduraismt.com" /></Field>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="gap-2"><Mail className="h-4 w-4" />Send Test Email</Button>
                  </div>
                </Section>
              )}

              {activeTab === "payments" && (
                <>
                  <Section title="Razorpay" desc="Accept Indian payments via Razorpay.">
                    <Field label="Key ID"><Input value={payments.razorpayKeyId} onChange={setP("razorpayKeyId")} placeholder="rzp_live_..." /></Field>
                    <Field label="Key Secret"><Input type="password" value={payments.razorpayKeySecret} onChange={setP("razorpayKeySecret")} placeholder="••••••••" /></Field>
                  </Section>
                  <Section title="Stripe" desc="Accept international payments via Stripe.">
                    <Field label="Publishable Key"><Input value={payments.stripePublishableKey} onChange={setP("stripePublishableKey")} placeholder="pk_live_..." /></Field>
                    <Field label="Secret Key"><Input type="password" value={payments.stripeSecretKey} onChange={setP("stripeSecretKey")} placeholder="••••••••" /></Field>
                  </Section>
                </>
              )}

              {activeTab === "domain" && (
                <Section title="Custom Domain" desc="Point your own domain to your TravelOS website.">
                  <Field label="Custom Domain" hint="e.g. www.maduraismt.com"><Input value={domain.customDomain} onChange={e => setDomain(f => ({ ...f, customDomain: e.target.value }))} placeholder="www.yourcompany.com" /></Field>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                    <p className="font-semibold">DNS Setup Instructions</p>
                    <p className="text-muted-foreground">Add a CNAME record pointing to your TravelOS subdomain:</p>
                    <code className="block bg-background border border-border rounded px-3 py-2 font-mono text-xs">CNAME → yourcompany.travelossaas.com</code>
                    <p className="text-muted-foreground">SSL certificate is provisioned automatically after DNS propagation (up to 24 hours).</p>
                  </div>
                </Section>
              )}

              {activeTab === "security" && (
                <Section title="Password & Security" desc="Update your account password and security settings.">
                  <Field label="Current Password"><Input type="password" placeholder="••••••••" /></Field>
                  <Field label="New Password"><Input type="password" placeholder="••••••••" /></Field>
                  <Field label="Confirm Password"><Input type="password" placeholder="••••••••" /></Field>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="gap-2"><Lock className="h-4 w-4" />Update Password</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                    </div>
                    <Button variant="outline" size="sm">Enable 2FA</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">API Access</p>
                      <p className="text-xs text-muted-foreground">Generate API keys for third-party integrations.</p>
                    </div>
                    <Button variant="outline" size="sm">Generate Key</Button>
                  </div>
                </Section>
              )}

              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={save} className="gap-2"><Save className="h-4 w-4" />Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
