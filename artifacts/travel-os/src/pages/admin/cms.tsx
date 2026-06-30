import { useState, useEffect } from "react";
import { useGetCmsSettings, useUpdateCmsSettings, useUpdateCompanyDomain, useGetCompany } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import {
  Globe, Palette, Layout, Phone, Share2, BarChart2, Type,
  Save, Eye, RefreshCw, Image, Search, Megaphone, Info, Star,
  CheckCircle2, Copy, ExternalLink, Link2,
} from "lucide-react";

type CmsForm = {
  heroTitle: string;
  heroSubtitle: string;
  heroDesc: string;
  heroCtaText: string;
  heroCtaPhone: string;
  heroBgImage: string;
  companyDisplayName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  phone: string;
  email: string;
  address: string;
  socialWhatsapp: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  stat1Value: string; stat1Label: string;
  stat2Value: string; stat2Label: string;
  stat3Value: string; stat3Label: string;
  stat4Value: string; stat4Label: string;
  aboutTitle: string;
  aboutText: string;
  announcementBar: string;
  ctaTitle: string;
  ctaSubtitle: string;
  showPackages: boolean;
  showDestinations: boolean;
  showEnquiryForm: boolean;
  metaTitle: string;
  metaDescription: string;
};

const EMPTY: CmsForm = {
  heroTitle: "", heroSubtitle: "", heroDesc: "", heroCtaText: "", heroCtaPhone: "", heroBgImage: "",
  companyDisplayName: "", tagline: "", logoUrl: "", faviconUrl: "", primaryColor: "#f97316",
  phone: "", email: "", address: "",
  socialWhatsapp: "", socialFacebook: "", socialInstagram: "", socialYoutube: "",
  stat1Value: "", stat1Label: "", stat2Value: "", stat2Label: "",
  stat3Value: "", stat3Label: "", stat4Value: "", stat4Label: "",
  aboutTitle: "", aboutText: "", announcementBar: "", ctaTitle: "", ctaSubtitle: "",
  showPackages: true, showDestinations: true, showEnquiryForm: true,
  metaTitle: "", metaDescription: "",
};

function FieldRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FRow({ label, k, form, setF, type = "text", placeholder = "", hint = "" }: {
  label: string; k: keyof CmsForm; form: CmsForm; setF: (k: keyof CmsForm) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; hint?: string;
}) {
  return (
    <FieldRow label={label} hint={hint}>
      <Input type={type} value={form[k] as string} onChange={setF(k)} placeholder={placeholder} />
    </FieldRow>
  );
}

function SectionBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-semibold text-base">{label}</h3>
    </div>
  );
}

export default function AdminCms() {
  const { user } = useAuth();
  const { data: settings, isLoading } = useGetCmsSettings();
  const { data: companyData } = useGetCompany(user?.companyId ?? "", { query: { enabled: !!user?.companyId } as any });
  const updateCms = useUpdateCmsSettings();
  const updateDomain = useUpdateCompanyDomain();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<CmsForm>(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [domainSaving, setDomainSaving] = useState(false);

  useEffect(() => {
    if (companyData?.domain) setCustomDomain(companyData.domain);
  }, [companyData]);

  useEffect(() => {
    if (!settings) return;
    setForm({
      heroTitle: settings.heroTitle ?? "",
      heroSubtitle: settings.heroSubtitle ?? "",
      heroDesc: settings.heroDesc ?? "",
      heroCtaText: settings.heroCtaText ?? "",
      heroCtaPhone: settings.heroCtaPhone ?? "",
      heroBgImage: settings.heroBgImage ?? "",
      companyDisplayName: settings.companyDisplayName ?? "",
      tagline: settings.tagline ?? "",
      logoUrl: settings.logoUrl ?? "",
      faviconUrl: settings.faviconUrl ?? "",
      primaryColor: settings.primaryColor ?? "#f97316",
      phone: settings.phone ?? "",
      email: settings.email ?? "",
      address: settings.address ?? "",
      socialWhatsapp: settings.socialWhatsapp ?? "",
      socialFacebook: settings.socialFacebook ?? "",
      socialInstagram: settings.socialInstagram ?? "",
      socialYoutube: settings.socialYoutube ?? "",
      stat1Value: settings.stat1Value ?? "", stat1Label: settings.stat1Label ?? "",
      stat2Value: settings.stat2Value ?? "", stat2Label: settings.stat2Label ?? "",
      stat3Value: settings.stat3Value ?? "", stat3Label: settings.stat3Label ?? "",
      stat4Value: settings.stat4Value ?? "", stat4Label: settings.stat4Label ?? "",
      aboutTitle: settings.aboutTitle ?? "",
      aboutText: settings.aboutText ?? "",
      announcementBar: settings.announcementBar ?? "",
      ctaTitle: settings.ctaTitle ?? "",
      ctaSubtitle: settings.ctaSubtitle ?? "",
      showPackages: settings.showPackages ?? true,
      showDestinations: settings.showDestinations ?? true,
      showEnquiryForm: settings.showEnquiryForm ?? true,
      metaTitle: settings.metaTitle ?? "",
      metaDescription: settings.metaDescription ?? "",
    });
    setDirty(false);
  }, [settings]);

  const setF = (k: keyof CmsForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true);
  };

  const setFInput = (k: keyof CmsForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true);
  };

  const toggle = (k: keyof CmsForm) => (v: boolean) => {
    setForm(f => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateCms.mutateAsync({ data: { ...form } });
      toast({ title: "Website settings saved", description: "Changes will be visible on your customer website." });
      qc.invalidateQueries({ queryKey: ["/v1/cms/settings"] });
      setDirty(false);
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  };

  const handleDomainSave = async () => {
    setDomainSaving(true);
    try {
      await updateDomain.mutateAsync({ data: { domain: customDomain } });
      toast({ title: "Custom domain saved", description: customDomain ? `Domain set to ${customDomain}` : "Domain cleared." });
      qc.invalidateQueries({ queryKey: [`/v1/company/${user?.companyId}`] });
    } catch {
      toast({ title: "Failed to save domain", variant: "destructive" });
    } finally {
      setDomainSaving(false);
    }
  };

  const previewUrl = `${window.location.origin}/`;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website CMS</h1>
          <p className="text-muted-foreground mt-1">Customise your customer-facing website — no code needed.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="gap-2">
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4" />Preview Site
            </a>
          </Button>
          <Button onClick={handleSave} disabled={!dirty || updateCms.isPending} className="gap-2">
            {updateCms.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {dirty ? "Save Changes" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Status bar */}
      {dirty && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <Info className="h-4 w-4 flex-shrink-0" />
          You have unsaved changes. Click <strong className="mx-1">Save Changes</strong> to publish them to your website.
        </div>
      )}

      {/* Live preview snapshot */}
      <Card className="shadow-sm border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold">Live Preview — {form.companyDisplayName || "Your Company"}</span>
          </div>
          <div
            className="rounded-xl overflow-hidden border border-border shadow-md relative"
            style={{ height: 220 }}
          >
            {form.heroBgImage ? (
              <img src={form.heroBgImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(0.4)" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-8 gap-2">
              {form.logoUrl && <img src={form.logoUrl} alt="Logo" className="h-10 object-contain mb-1" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
              <h2 className="text-2xl font-black leading-tight">{form.heroTitle || "Your Company Name"}</h2>
              <p className="text-sm opacity-80 italic">{form.heroSubtitle || "Your tagline here"}</p>
              <div className="mt-2 px-5 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: form.primaryColor || "#f97316" }}>
                {form.heroCtaText || "Book Now"}
              </div>
            </div>
          </div>
          {/* Stat bar preview */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              { v: form.stat1Value, l: form.stat1Label },
              { v: form.stat2Value, l: form.stat2Label },
              { v: form.stat3Value, l: form.stat3Label },
              { v: form.stat4Value, l: form.stat4Label },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-black text-primary">{s.v || "—"}</p>
                <p className="text-xs text-muted-foreground">{s.l || "Stat"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="hero">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="hero" className="gap-1.5"><Image className="h-3.5 w-3.5" />Hero</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5"><Palette className="h-3.5 w-3.5" />Branding</TabsTrigger>
          <TabsTrigger value="contact" className="gap-1.5"><Phone className="h-3.5 w-3.5" />Contact</TabsTrigger>
          <TabsTrigger value="social" className="gap-1.5"><Share2 className="h-3.5 w-3.5" />Social</TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5"><BarChart2 className="h-3.5 w-3.5" />Stats</TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5"><Type className="h-3.5 w-3.5" />Content</TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5"><Layout className="h-3.5 w-3.5" />Sections</TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5"><Search className="h-3.5 w-3.5" />SEO</TabsTrigger>
          <TabsTrigger value="domain" className="gap-1.5"><Globe className="h-3.5 w-3.5" />Domain</TabsTrigger>
        </TabsList>

        {/* ── Hero ── */}
        <TabsContent value="hero" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Hero Section</CardTitle><CardDescription>The first thing visitors see on your website.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <SectionBadge icon={Image} label="Hero Text" />
              <div className="grid md:grid-cols-2 gap-4">
                <FRow label="Main Heading" k="heroTitle" form={form} setF={setFInput} placeholder="Madurai SMT Travels" hint="Large text shown on the hero banner" />
                <FRow label="Subheading" k="heroSubtitle" form={form} setF={setFInput} placeholder="Your Journey, Our Passion" />
              </div>
              <FieldRow label="Hero Description" hint="Short paragraph below the heading">
                <Textarea value={form.heroDesc} onChange={setF("heroDesc")} placeholder="Premium cab and tour services…" rows={2} />
              </FieldRow>
              <div className="grid md:grid-cols-2 gap-4">
                <FRow label="CTA Button Text" k="heroCtaText" form={form} setF={setFInput} placeholder="Book a Trip" />
                <FRow label="CTA Phone Number" k="heroCtaPhone" form={form} setF={setFInput} placeholder="8110806339" hint="Tapped on mobile to call" />
              </div>
              <FieldRow label="Hero Background Image URL" hint="Paste a direct image URL (Unsplash, drive, CDN, etc.)">
                <div className="flex gap-2">
                  <Input value={form.heroBgImage} onChange={setFInput("heroBgImage")} placeholder="https://images.unsplash.com/…" className="flex-1" />
                  {form.heroBgImage && (
                    <img src={form.heroBgImage} alt="" className="h-9 w-16 rounded object-cover border border-border flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                </div>
              </FieldRow>
              <FieldRow label="Announcement Ticker" hint="Scrolling bar at top — separate multiple messages with |">
                <div className="flex gap-2 items-start">
                  <Megaphone className="h-4 w-4 mt-2.5 text-muted-foreground flex-shrink-0" />
                  <Textarea value={form.announcementBar} onChange={setF("announcementBar")} placeholder="✈️ New packages to Kodaikanal | 🚗 AC Cab available 24/7 | Special group rates" rows={2} />
                </div>
              </FieldRow>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Branding ── */}
        <TabsContent value="branding" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Branding</CardTitle><CardDescription>Company name, logo, colours, and identity.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <SectionBadge icon={Palette} label="Identity" />
              <div className="grid md:grid-cols-2 gap-4">
                <FRow label="Company Display Name" k="companyDisplayName" form={form} setF={setFInput} placeholder="Madurai SMT Travels" hint="Shown in header, footer, hero" />
                <FRow label="Tagline" k="tagline" form={form} setF={setFInput} placeholder="Your Journey, Our Passion" />
              </div>
              <FieldRow label="Logo URL" hint="Direct link to your logo image (PNG/SVG, transparent background recommended)">
                <div className="flex gap-2">
                  <Input value={form.logoUrl} onChange={setFInput("logoUrl")} placeholder="https://…/logo.png" className="flex-1" />
                  {form.logoUrl && <img src={form.logoUrl} alt="Logo" className="h-9 w-16 rounded object-contain border border-border flex-shrink-0 bg-white p-1" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                </div>
              </FieldRow>
              <FRow label="Favicon URL" k="faviconUrl" form={form} setF={setFInput} placeholder="https://…/favicon.ico" hint="Small icon shown in browser tab" />
              <FieldRow label="Primary Colour" hint="Used for buttons, highlights, and accents across the website">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primaryColor} onChange={setFInput("primaryColor")} className="h-10 w-16 rounded cursor-pointer border border-input" />
                  <Input value={form.primaryColor} onChange={setFInput("primaryColor")} placeholder="#f97316" className="font-mono w-36" />
                  <div className="h-9 flex-1 rounded-lg border border-input" style={{ backgroundColor: form.primaryColor }} />
                </div>
              </FieldRow>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Contact ── */}
        <TabsContent value="contact" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Contact Information</CardTitle><CardDescription>Shown in the footer and contact page.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <SectionBadge icon={Phone} label="Contact Details" />
              <div className="grid md:grid-cols-2 gap-4">
                <FRow label="Phone Number" k="phone" form={form} setF={setFInput} placeholder="8110806339" />
                <FRow label="Email Address" k="email" form={form} setF={setFInput} placeholder="info@maduraismt.com" type="email" />
              </div>
              <FieldRow label="Address / Location">
                <Textarea value={form.address} onChange={setF("address")} placeholder="123 Main Street, Madurai, Tamil Nadu 625001" rows={2} />
              </FieldRow>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Social ── */}
        <TabsContent value="social" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Social Media Links</CardTitle><CardDescription>Shown in the footer. Leave blank to hide.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <SectionBadge icon={Share2} label="Social Profiles" />
              <div className="grid md:grid-cols-2 gap-4">
                <FRow label="WhatsApp Number" k="socialWhatsapp" form={form} setF={setFInput} placeholder="918110806339" hint="Country code without +" />
                <FRow label="Facebook Page URL" k="socialFacebook" form={form} setF={setFInput} placeholder="https://facebook.com/yourpage" />
                <FRow label="Instagram Profile URL" k="socialInstagram" form={form} setF={setFInput} placeholder="https://instagram.com/yourhandle" />
                <FRow label="YouTube Channel URL" k="socialYoutube" form={form} setF={setFInput} placeholder="https://youtube.com/@yourchannel" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Stats ── */}
        <TabsContent value="stats" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Trust Statistics</CardTitle><CardDescription>4 numbers displayed below the hero to build credibility.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <SectionBadge icon={Star} label="Key Metrics" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  ["stat1Value","stat1Label"],
                  ["stat2Value","stat2Label"],
                  ["stat3Value","stat3Label"],
                  ["stat4Value","stat4Label"],
                ] as [keyof CmsForm, keyof CmsForm][]).map(([vk, lk], i) => (
                  <div key={i} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stat {i+1}</p>
                    <Input value={form[vk] as string} onChange={setFInput(vk)} placeholder="5000+" className="font-bold text-center text-lg h-10" />
                    <Input value={form[lk] as string} onChange={setFInput(lk)} placeholder="Happy Customers" className="text-center text-xs" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">These appear as animated numbers below the hero banner on your website.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Content ── */}
        <TabsContent value="content" className="mt-4">
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">About Section</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FRow label="About Section Title" k="aboutTitle" form={form} setF={setFInput} placeholder="Why Choose Us?" />
                <FieldRow label="About Description">
                  <Textarea value={form.aboutText} onChange={setF("aboutText")} placeholder="We are Madurai's most trusted travel partner…" rows={4} />
                </FieldRow>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Bottom CTA Banner</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FRow label="CTA Title" k="ctaTitle" form={form} setF={setFInput} placeholder="Ready to Explore South India?" />
                <FRow label="CTA Subtitle" k="ctaSubtitle" form={form} setF={setFInput} placeholder="Book your dream trip today. Best prices, best service." />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Sections ── */}
        <TabsContent value="features" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Page Sections</CardTitle><CardDescription>Toggle which sections appear on your website homepage.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <SectionBadge icon={Layout} label="Section Visibility" />
              {[
                { label: "Tour Packages Section", desc: "Showcase your travel packages with pricing and booking CTA.", key: "showPackages" as keyof CmsForm },
                { label: "Destinations Gallery", desc: "Visual grid of popular destinations.", key: "showDestinations" as keyof CmsForm },
                { label: "Enquiry Form", desc: "Contact form for customers to submit booking requests.", key: "showEnquiryForm" as keyof CmsForm },
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-semibold text-sm">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                  <Switch checked={form[s.key] as boolean} onCheckedChange={toggle(s.key)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SEO ── */}
        <TabsContent value="seo" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">SEO & Meta Tags</CardTitle><CardDescription>Controls how your website appears in Google search results.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <SectionBadge icon={Search} label="Search Engine Optimisation" />
              <FRow label="Page Title" k="metaTitle" form={form} setF={setFInput} placeholder="Madurai SMT Travels — Cab & Tour Packages" hint="Shown in browser tab and Google results. Keep under 60 characters." />
              <div className="mt-0.5 text-xs text-muted-foreground">
                Character count: <span className={form.metaTitle.length > 60 ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}>{form.metaTitle.length}/60</span>
              </div>
              <FieldRow label="Meta Description" hint="Short description shown in Google results. Keep under 155 characters.">
                <Textarea value={form.metaDescription} onChange={setF("metaDescription")} placeholder="Book cab and tour packages across South India…" rows={3} />
              </FieldRow>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Character count: <span className={form.metaDescription.length > 155 ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}>{form.metaDescription.length}/155</span>
              </div>
              {/* Google preview */}
              <div className="mt-2 p-4 rounded-lg border border-border bg-white">
                <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Google Preview</p>
                <p className="text-[#1a0dab] text-lg leading-tight font-medium truncate">{form.metaTitle || "Madurai SMT Travels — Cab & Tour Packages"}</p>
                <p className="text-[#006621] text-sm">{window.location.origin}/</p>
                <p className="text-[#545454] text-sm mt-1 line-clamp-2">{form.metaDescription || "Book cab and tour packages across South India with Madurai SMT Travels. Best prices, trusted service, 24/7 support."}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Custom Domain ── */}
        <TabsContent value="domain" className="mt-4">
          <div className="space-y-4">
            {/* Domain input */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" />Custom Domain</CardTitle>
                <CardDescription>Point your own domain name (e.g. www.maduraismt.com) to this TravelOS website.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Your Domain</Label>
                  <div className="flex gap-2">
                    <Input
                      value={customDomain}
                      onChange={e => setCustomDomain(e.target.value)}
                      placeholder="www.maduraismt.com"
                      className="font-mono flex-1"
                    />
                    <Button onClick={handleDomainSave} disabled={domainSaving} className="gap-2 shrink-0">
                      {domainSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Enter only the hostname, e.g. <code className="bg-muted px-1 rounded">www.maduraismt.com</code> — no <code className="bg-muted px-1 rounded">https://</code></p>
                </div>

                {companyData?.domain && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>Domain saved: <strong>{companyData.domain}</strong></span>
                    <a href={`https://${companyData.domain}`} target="_blank" rel="noopener noreferrer" className="ml-auto hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3.5 w-3.5" />Visit
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DNS setup */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">DNS Setup Instructions</CardTitle>
                <CardDescription>Add these records in your domain registrar (GoDaddy, Namecheap, Google Domains, etc.)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Step 1 — Add a CNAME record</p>
                  <div className="rounded-lg border border-border overflow-hidden text-sm">
                    <div className="grid grid-cols-3 bg-muted/50 px-4 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                      <span>Type</span><span>Name / Host</span><span>Value / Points to</span>
                    </div>
                    <div className="grid grid-cols-3 px-4 py-3 font-mono text-sm items-center">
                      <span className="text-blue-600 font-bold">CNAME</span>
                      <span>www</span>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{window.location.hostname}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(window.location.hostname); }}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title="Copy"
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">For a root domain (e.g. <code className="bg-muted px-1 rounded">maduraismt.com</code> without www), use an <strong>A record</strong> or <strong>ALIAS</strong> record pointing to the same value — check your registrar's support docs for root-level CNAME support.</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">Step 2 — Wait for DNS propagation</p>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>DNS changes can take <strong>5 minutes to 48 hours</strong> to propagate worldwide. Once propagated, visitors to your domain will see your TravelOS customer website.</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">Step 3 — How it works</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {[
                      "Your customer types www.maduraismt.com in their browser",
                      "DNS resolves to TravelOS via the CNAME record",
                      "TravelOS serves your company's CMS-configured website",
                      "Your branding, packages, and content appear automatically",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deploy reminder */}
            <Card className="shadow-sm border-amber-200 bg-amber-50">
              <CardContent className="p-4 flex items-start gap-3">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Deploy your app first</p>
                  <p>Custom domains only work on a <strong>published/deployed</strong> version of TravelOS. Click the <strong>Publish</strong> button in the top-right of the Replit workspace to deploy your app and get a stable public URL.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky save at bottom */}
      {dirty && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button onClick={handleSave} disabled={updateCms.isPending} size="lg" className="shadow-xl gap-2">
            {updateCms.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
