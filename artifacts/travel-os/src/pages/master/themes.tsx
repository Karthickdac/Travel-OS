import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Palette, Puzzle, MessageCircle, Smartphone, CreditCard, MapPin, Image as ImageIcon,
  Check, Sparkles,
} from "lucide-react";

type ThemePreset = {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
};

const THEMES: ThemePreset[] = [
  { name: "Travel Agency", description: "Warm, trustworthy default theme", primary: "#2563eb", secondary: "#0ea5e9", accent: "#f59e0b" },
  { name: "Coastal Blue", description: "Fresh seaside blues", primary: "#0284c7", secondary: "#06b6d4", accent: "#14b8a6" },
  { name: "Sunset Orange", description: "Energetic warm gradients", primary: "#ea580c", secondary: "#f97316", accent: "#facc15" },
  { name: "Forest Green", description: "Earthy, nature-inspired", primary: "#15803d", secondary: "#22c55e", accent: "#84cc16" },
  { name: "Royal Purple", description: "Premium regal tones", primary: "#7c3aed", secondary: "#a855f7", accent: "#ec4899" },
  { name: "Minimal Mono", description: "Clean monochrome aesthetic", primary: "#1f2937", secondary: "#6b7280", accent: "#9ca3af" },
  { name: "Luxury Gold", description: "Opulent gold & charcoal", primary: "#b45309", secondary: "#d97706", accent: "#fbbf24" },
  { name: "Modern Dark", description: "Sleek dark-first palette", primary: "#6366f1", secondary: "#8b5cf6", accent: "#22d3ee" },
  { name: "Vibrant Coral", description: "Playful coral & teal", primary: "#f43f5e", secondary: "#fb7185", accent: "#2dd4bf" },
  { name: "Classic Navy", description: "Corporate navy & slate", primary: "#1e3a8a", secondary: "#3b82f6", accent: "#64748b" },
];

type Plugin = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: typeof MessageCircle;
  defaultEnabled: boolean;
};

const PLUGINS: Plugin[] = [
  { id: "whatsapp", name: "WhatsApp Business", description: "Send booking confirmations and updates via WhatsApp.", category: "Messaging", icon: MessageCircle, defaultEnabled: true },
  { id: "sms", name: "SMS Gateway", description: "Transactional SMS alerts for bookings and OTPs.", category: "Messaging", icon: Smartphone, defaultEnabled: true },
  { id: "payment", name: "Payment Gateway", description: "Accept online payments via Razorpay & Stripe.", category: "Payments", icon: CreditCard, defaultEnabled: true },
  { id: "gps", name: "GPS Tracking", description: "Live vehicle tracking and route monitoring.", category: "Fleet", icon: MapPin, defaultEnabled: false },
  { id: "cloudinary", name: "Cloudinary Media", description: "Image & video hosting with auto-optimisation.", category: "Media", icon: ImageIcon, defaultEnabled: false },
];

export default function MasterThemes() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    () => Object.fromEntries(PLUGINS.map(p => [p.id, p.defaultEnabled]))
  );

  const enabledCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Themes &amp; Plugins</h1>
        <p className="text-muted-foreground mt-1">Platform-level catalog of available themes and modules for tenant companies.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Available Themes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{THEMES.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Available Plugins</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{PLUGINS.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Enabled Plugins</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{enabledCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Disabled Plugins</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-gray-500">{PLUGINS.length - enabledCount}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="themes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="themes" className="gap-2"><Palette className="h-4 w-4" />Theme Catalog</TabsTrigger>
          <TabsTrigger value="plugins" className="gap-2"><Puzzle className="h-4 w-4" />Plugins &amp; Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="space-y-4">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {THEMES.map(theme => (
              <Card key={theme.name} className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}>
                  <div className="absolute bottom-3 right-3 h-8 w-8 rounded-full border-2 border-white/80 shadow" style={{ backgroundColor: theme.accent }} />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />{theme.name}
                  </CardTitle>
                  <CardDescription className="text-xs">{theme.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {[theme.primary, theme.secondary, theme.accent].map((c, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="h-7 w-7 rounded-md border border-border shadow-sm" style={{ backgroundColor: c }} />
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{["Pri", "Sec", "Acc"][i]}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="plugins" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {PLUGINS.map(plugin => {
              const Icon = plugin.icon;
              const isOn = enabled[plugin.id];
              return (
                <Card key={plugin.id} className={`shadow-sm transition-shadow ${isOn ? "border-primary/30" : ""}`}>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className={`h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 ${isOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{plugin.name}</h3>
                        <Badge variant="outline" className="text-[10px]">{plugin.category}</Badge>
                        <Badge variant="outline" className={isOn ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600"}>
                          {isOn ? <span className="flex items-center gap-1"><Check className="h-3 w-3" />Enabled</span> : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{plugin.description}</p>
                    </div>
                    <Switch
                      checked={isOn}
                      onCheckedChange={v => setEnabled(s => ({ ...s, [plugin.id]: v }))}
                      className="mt-1"
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            This is the platform module catalog. Toggle states shown here are illustrative — per-tenant activation is managed in company settings.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
