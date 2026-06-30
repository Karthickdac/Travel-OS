import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Palette, Check, Save, Sparkles, Type, Square, Moon } from "lucide-react";

type CompanySettings = {
  id: string;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
  darkMode: string;
};

type Preset = {
  key: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

const PRESETS: Preset[] = [
  { key: "travel_agency", name: "Travel Agency", primaryColor: "#f97316", secondaryColor: "#0d9488", accentColor: "#3b82f6" },
  { key: "coastal_blue", name: "Coastal Blue", primaryColor: "#0284c7", secondaryColor: "#06b6d4", accentColor: "#14b8a6" },
  { key: "sunset_orange", name: "Sunset Orange", primaryColor: "#ea580c", secondaryColor: "#f59e0b", accentColor: "#ef4444" },
  { key: "forest_green", name: "Forest Green", primaryColor: "#16a34a", secondaryColor: "#65a30d", accentColor: "#0d9488" },
  { key: "royal_purple", name: "Royal Purple", primaryColor: "#7c3aed", secondaryColor: "#a855f7", accentColor: "#ec4899" },
  { key: "minimal_mono", name: "Minimal Mono", primaryColor: "#171717", secondaryColor: "#525252", accentColor: "#737373" },
  { key: "luxury_gold", name: "Luxury Gold", primaryColor: "#ca8a04", secondaryColor: "#a16207", accentColor: "#854d0e" },
  { key: "modern_dark", name: "Modern Dark", primaryColor: "#6366f1", secondaryColor: "#8b5cf6", accentColor: "#22d3ee" },
  { key: "vibrant_coral", name: "Vibrant Coral", primaryColor: "#f43f5e", secondaryColor: "#fb7185", accentColor: "#fbbf24" },
  { key: "classic_navy", name: "Classic Navy", primaryColor: "#1e3a8a", secondaryColor: "#1d4ed8", accentColor: "#0ea5e9" },
];

const FONT_OPTIONS = ["Inter", "Roboto", "Poppins", "Montserrat", "Lato", "Open Sans", "Nunito", "Playfair Display"];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-md border border-input bg-background cursor-pointer p-1"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono uppercase" placeholder="#000000" />
      </div>
    </div>
  );
}

export default function AdminThemes() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<CompanySettings>>({});

  const { data: settings, isLoading } = useQuery<CompanySettings>({
    queryKey: ["/v1/company/settings"],
    queryFn: () => api.get("/company/settings"),
  });

  useEffect(() => {
    if (settings) {
      setForm({
        theme: settings.theme,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        accentColor: settings.accentColor,
        fontFamily: settings.fontFamily,
        borderRadius: settings.borderRadius,
        darkMode: settings.darkMode,
      });
    }
  }, [settings]);

  const set = (k: keyof CompanySettings, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const applyPreset = (p: Preset) => {
    setForm((f) => ({ ...f, theme: p.key, primaryColor: p.primaryColor, secondaryColor: p.secondaryColor, accentColor: p.accentColor }));
  };

  const saveMut = useMutation({
    mutationFn: (d: Partial<CompanySettings>) => api.put("/company/settings", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/v1/company/settings"] });
      toast({ title: "Theme saved", description: "Your theme settings have been updated." });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const radiusMap: Record<string, string> = { sharp: "0px", rounded: "12px", pill: "9999px" };
  const previewRadius = radiusMap[form.borderRadius ?? "rounded"] ?? "12px";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theme Engine</h1>
          <p className="text-muted-foreground mt-1">Customise your storefront colours, fonts and appearance.</p>
        </div>
        <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} className="gap-2">
          <Save className="h-4 w-4" /> {saveMut.isPending ? "Saving…" : "Save Theme"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" /> Theme Presets</CardTitle>
          <CardDescription>Pick a starting point — colours below update automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PRESETS.map((p) => {
              const selected = form.theme === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p)}
                  className={`relative text-left rounded-xl border p-3 transition-all hover:shadow-md ${selected ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                >
                  {selected && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div className="flex gap-1.5 mb-2">
                    <span className="h-8 w-8 rounded-md" style={{ backgroundColor: p.primaryColor }} />
                    <span className="h-8 w-8 rounded-md" style={{ backgroundColor: p.secondaryColor }} />
                    <span className="h-8 w-8 rounded-md" style={{ backgroundColor: p.accentColor }} />
                  </div>
                  <p className="text-sm font-medium leading-tight">{p.name}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg"><Palette className="h-5 w-5 text-primary" /> Customisation</CardTitle>
            <CardDescription>Fine-tune individual colours and typography.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <ColorField label="Primary Colour" value={form.primaryColor ?? "#000000"} onChange={(v) => set("primaryColor", v)} />
              <ColorField label="Secondary Colour" value={form.secondaryColor ?? "#000000"} onChange={(v) => set("secondaryColor", v)} />
              <ColorField label="Accent Colour" value={form.accentColor ?? "#000000"} onChange={(v) => set("accentColor", v)} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Type className="h-3.5 w-3.5" /> Font Family</Label>
                <Select value={form.fontFamily ?? "Inter"} onValueChange={(v) => set("fontFamily", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Square className="h-3.5 w-3.5" /> Border Radius</Label>
                <Select value={form.borderRadius ?? "rounded"} onValueChange={(v) => set("borderRadius", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sharp">Sharp</SelectItem>
                    <SelectItem value="rounded">Rounded</SelectItem>
                    <SelectItem value="pill">Pill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Moon className="h-3.5 w-3.5" /> Dark Mode</Label>
                <Select value={form.darkMode ?? "system"} onValueChange={(v) => set("darkMode", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Live Preview</CardTitle>
            <CardDescription>How your theme looks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden" style={{ fontFamily: form.fontFamily }}>
              <div className="p-4 text-white" style={{ backgroundColor: form.primaryColor }}>
                <p className="text-xs opacity-80">Welcome to</p>
                <p className="text-lg font-bold">Your Travel Co.</p>
              </div>
              <div className="p-4 space-y-3 bg-card">
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm text-white font-medium" style={{ backgroundColor: form.primaryColor, borderRadius: previewRadius }}>
                    Book Now
                  </button>
                  <button className="px-3 py-1.5 text-sm text-white font-medium" style={{ backgroundColor: form.secondaryColor, borderRadius: previewRadius }}>
                    Explore
                  </button>
                </div>
                <span className="inline-block px-2.5 py-0.5 text-xs text-white font-medium" style={{ backgroundColor: form.accentColor, borderRadius: previewRadius }}>
                  Featured
                </span>
                <div className="space-y-1.5">
                  <div className="h-2 rounded-full bg-muted" style={{ width: "100%" }} />
                  <div className="h-2 rounded-full bg-muted" style={{ width: "80%" }} />
                  <div className="h-2 rounded-full bg-muted" style={{ width: "60%" }} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">Font: {form.fontFamily}</Badge>
              <Badge variant="outline">Radius: {form.borderRadius}</Badge>
              <Badge variant="outline">Mode: {form.darkMode}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
