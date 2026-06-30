import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LayoutTemplate, Check, Save, Sparkles, Eye } from "lucide-react";
import {
  TEMPLATE_LIST,
  SECTION_META,
  SECTION_VARIANTS,
  getTemplate,
  resolveSectionLayouts,
  type SectionKey,
  type TemplateKey,
} from "@/lib/homepage-templates";

type WebsiteSettings = {
  homepageTemplate: string;
  sectionLayouts: string;
  showDestinations: boolean;
  showPackages: boolean;
  showEnquiryForm: boolean;
};

export default function AdminWebsiteLayout() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [template, setTemplate] = useState<TemplateKey>("classic");
  const [sectionLayouts, setSectionLayouts] = useState<Record<SectionKey, string>>(
    () => resolveSectionLayouts("classic", "{}"),
  );
  const [showDestinations, setShowDestinations] = useState(true);
  const [showPackages, setShowPackages] = useState(true);

  const { data: settings, isLoading } = useQuery<WebsiteSettings>({
    queryKey: ["/v1/cms/settings"],
    queryFn: () => api.get("/cms/settings"),
  });

  useEffect(() => {
    if (settings) {
      const tpl = getTemplate(settings.homepageTemplate).key;
      setTemplate(tpl);
      setSectionLayouts(resolveSectionLayouts(settings.homepageTemplate, settings.sectionLayouts));
      setShowDestinations(settings.showDestinations);
      setShowPackages(settings.showPackages);
    }
  }, [settings]);

  // Selecting a template resets section variants to that template's defaults.
  const applyTemplate = (key: TemplateKey) => {
    setTemplate(key);
    setSectionLayouts(resolveSectionLayouts(key, "{}"));
  };

  const setSection = (key: SectionKey, value: string) =>
    setSectionLayouts((prev) => ({ ...prev, [key]: value }));

  const saveMut = useMutation({
    mutationFn: () =>
      api.put("/cms/settings", {
        homepageTemplate: template,
        sectionLayouts: JSON.stringify(sectionLayouts),
        showDestinations,
        showPackages,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/v1/cms/settings"] });
      toast({ title: "Layout saved", description: "Your website homepage layout has been updated." });
    },
    onError: (e: any) => toast({ title: e.message ?? "Failed to save", variant: "destructive" }),
  });

  const activeTemplate = getTemplate(template);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website Layout</h1>
          <p className="text-muted-foreground mt-1">Choose a homepage template and section layouts visitors will see.</p>
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="gap-2">
          <Save className="h-4 w-4" /> {saveMut.isPending ? "Saving…" : "Save Layout"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" /> Homepage Template</CardTitle>
          <CardDescription>Pick an overall style. Section layouts below update to match — you can still fine-tune each.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TEMPLATE_LIST.map((tpl) => {
              const selected = template === tpl.key;
              return (
                <button
                  key={tpl.key}
                  onClick={() => applyTemplate(tpl.key)}
                  className={`relative text-left rounded-xl border p-3 transition-all hover:shadow-md ${selected ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                >
                  {selected && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div className="flex gap-1.5 mb-2">
                    {tpl.swatch.map((c, i) => (
                      <span key={i} className="h-8 flex-1 rounded-md" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <p className="text-sm font-semibold leading-tight">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{tpl.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg"><LayoutTemplate className="h-5 w-5 text-primary" /> Section Layouts</CardTitle>
            <CardDescription>Choose how each homepage section is arranged and toggle visibility.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {SECTION_META.map(({ key, label }) => {
              const toggle =
                key === "destinations"
                  ? { value: showDestinations, set: setShowDestinations }
                  : key === "packages"
                  ? { value: showPackages, set: setShowPackages }
                  : null;
              return (
                <div key={key} className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex-1 space-y-1.5">
                    <Label>{label}</Label>
                    <Select value={sectionLayouts[key]} onValueChange={(v) => setSection(key, v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SECTION_VARIANTS[key].map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {toggle && (
                    <div className="flex items-center gap-2 pb-2.5">
                      <Switch checked={toggle.value} onCheckedChange={toggle.set} />
                      <span className="text-sm text-muted-foreground">{toggle.value ? "Visible" : "Hidden"}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg"><Eye className="h-5 w-5 text-primary" /> Preview</CardTitle>
            <CardDescription>Wireframe of your homepage order.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden bg-muted/30">
              <div className="p-3 text-white text-center" style={{ background: `linear-gradient(135deg, ${activeTemplate.swatch[0]}, ${activeTemplate.swatch[1]})` }}>
                <p className="text-[10px] opacity-80 uppercase tracking-widest">Hero · {sectionLayouts.hero}</p>
                <p className="text-sm font-bold" style={activeTemplate.tokens.headingFont ? { fontFamily: activeTemplate.tokens.headingFont } : undefined}>Your Travel Co.</p>
              </div>
              <div className="p-3 space-y-2">
                {showDestinations && <PreviewBlock label={`Destinations · ${sectionLayouts.destinations}`} />}
                {showPackages && <PreviewBlock label={`Packages · ${sectionLayouts.packages}`} />}
                <PreviewBlock label={`Why Choose Us · ${sectionLayouts.whyUs}`} />
                <PreviewBlock label="Services" muted />
                <PreviewBlock label="Call to Action" muted />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{activeTemplate.name} — {activeTemplate.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PreviewBlock({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 text-xs font-medium ${muted ? "bg-muted/40 text-muted-foreground" : "bg-card"}`}>
      {label}
    </div>
  );
}
