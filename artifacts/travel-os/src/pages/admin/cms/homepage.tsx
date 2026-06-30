import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LayoutTemplate, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Layers, Eye, EyeOff, GripVertical } from "lucide-react";

type HomepageSection = {
  id: string;
  sectionType: string;
  title?: string | null;
  config: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
};

const SECTION_TYPES: { value: string; label: string }[] = [
  { value: "hero", label: "Hero Banner" },
  { value: "search_box", label: "Search Box" },
  { value: "featured_cars", label: "Featured Cars" },
  { value: "popular_destinations", label: "Popular Destinations" },
  { value: "popular_tours", label: "Popular Tours" },
  { value: "why_choose_us", label: "Why Choose Us" },
  { value: "testimonials", label: "Testimonials" },
  { value: "statistics", label: "Statistics" },
  { value: "gallery", label: "Gallery" },
  { value: "video", label: "Video" },
  { value: "offers", label: "Offers" },
  { value: "latest_blogs", label: "Latest Blogs" },
  { value: "partners", label: "Partners" },
  { value: "faq", label: "FAQ" },
  { value: "newsletter", label: "Newsletter" },
  { value: "contact", label: "Contact" },
  { value: "google_reviews", label: "Google Reviews" },
  { value: "instagram_feed", label: "Instagram Feed" },
  { value: "footer", label: "Footer" },
  { value: "announcement_bar", label: "Announcement Bar" },
];

function sectionLabel(type: string) {
  return SECTION_TYPES.find(s => s.value === type)?.label ?? type;
}

const BLANK = { sectionType: "hero", title: "", config: "{}", isVisible: true };

function SectionForm({ initial, onSave, onCancel, saving }: { initial?: any; onSave: (d: any) => void; onCancel: () => void; saving?: boolean }) {
  const [form, setForm] = useState<Record<string, any>>({ ...BLANK, ...initial, config: initial?.config ?? "{}" });
  const [configError, setConfigError] = useState<string | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f: Record<string, any>) => ({ ...f, [k]: e.target.value }));

  const validateAndSave = () => {
    let cfg = form.config?.trim() || "{}";
    try {
      JSON.parse(cfg);
    } catch {
      setConfigError("Config must be valid JSON");
      return;
    }
    setConfigError(null);
    onSave({ ...form, config: cfg, title: form.title || undefined });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Section Type *</Label>
          <Select value={form.sectionType} onValueChange={v => setForm(f => ({ ...f, sectionType: v }))} disabled={!!initial?.id}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SECTION_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={form.title} onChange={set("title")} placeholder="Section heading" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Config (JSON)</Label>
        <Textarea
          value={form.config}
          onChange={set("config")}
          placeholder='{"subtitle": "Welcome", "buttonText": "Book Now"}'
          className="font-mono text-xs min-h-[140px]"
        />
        {configError && <p className="text-xs text-destructive">{configError}</p>}
        <p className="text-xs text-muted-foreground">Section-specific settings as a JSON object (e.g. images, text, links).</p>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={form.isVisible} onCheckedChange={v => setForm((f: Record<string, any>) => ({ ...f, isVisible: v }))} />
        <Label>Visible on homepage</Label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={validateAndSave} disabled={saving}>{initial?.id ? "Save Changes" : "Add Section"}</Button>
      </div>
    </div>
  );
}

export default function AdminHomepageBuilder() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data?: HomepageSection } | null>(null);

  const { data: sections, isLoading } = useQuery<HomepageSection[]>({
    queryKey: ["/v1/cms/homepage-sections"],
    queryFn: () => api.get("/cms/homepage-sections"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/cms/homepage-sections"] });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/cms/homepage-sections", d),
    onSuccess: () => { refresh(); setDialog(null); toast({ title: "Section added" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => api.patch(`/cms/homepage-sections/${id}`, d),
    onSuccess: () => { refresh(); setDialog(null); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/cms/homepage-sections/${id}`),
    onSuccess: () => { refresh(); toast({ title: "Section deleted" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const handleSave = (d: any) => {
    if (dialog?.mode === "edit" && dialog.data) {
      updateMut.mutate({ id: dialog.data.id, title: d.title, config: d.config, isVisible: d.isVisible }, {
        onSuccess: () => toast({ title: "Section updated" }),
      });
    } else {
      const nextOrder = sorted.length ? sorted[sorted.length - 1].sortOrder + 1 : 0;
      createMut.mutate({ ...d, sortOrder: nextOrder });
    }
  };

  const sorted = [...(sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[target];
    updateMut.mutate({ id: a.id, sortOrder: b.sortOrder });
    updateMut.mutate({ id: b.id, sortOrder: a.sortOrder });
  };

  const toggleVisible = (s: HomepageSection) => {
    updateMut.mutate({ id: s.id, isVisible: !s.isVisible });
  };

  const visibleCount = sorted.filter(s => s.isVisible).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Homepage Builder</h1>
          <p className="text-muted-foreground mt-1">Arrange the sections that make up your public homepage.</p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })} className="gap-2">
          <Plus className="h-4 w-4" /> Add Section
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Sections</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{sorted.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Visible</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{visibleCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Hidden</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-gray-500">{sorted.length - visibleCount}</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : !sorted.length ? (
        <Card className="text-center py-16"><CardContent className="pt-6"><LayoutTemplate className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No sections yet</p><p className="text-sm text-muted-foreground mt-1">Add your first homepage section to get started.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((s, i) => (
            <Card key={s.id} className={`shadow-sm transition-shadow hover:shadow-md ${!s.isVisible ? "opacity-60" : ""}`}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex flex-col items-center">
                  <Button size="icon" variant="ghost" className="h-6 w-6" disabled={i === 0 || updateMut.isPending} onClick={() => move(i, -1)}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Button size="icon" variant="ghost" className="h-6 w-6" disabled={i === sorted.length - 1 || updateMut.isPending} onClick={() => move(i, 1)}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{s.title || sectionLabel(s.sectionType)}</span>
                    <Badge variant="outline" className="text-xs">{sectionLabel(s.sectionType)}</Badge>
                    <Badge variant="outline" className={s.isVisible ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600"}>
                      {s.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Position {i + 1} · order {s.sortOrder}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => toggleVisible(s)} disabled={updateMut.isPending}>
                    {s.isVisible ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                    {s.isVisible ? "Hide" : "Show"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "edit", data: s })}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete "${s.title || sectionLabel(s.sectionType)}"?`)) deleteMut.mutate(s.id); }}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? "Edit Section" : "Add Section"}</DialogTitle>
          </DialogHeader>
          {dialog && <SectionForm initial={dialog.data} onSave={handleSave} onCancel={() => setDialog(null)} saving={createMut.isPending || updateMut.isPending} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
