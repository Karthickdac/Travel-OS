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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Save, Plus, Trash2, ArrowRight } from "lucide-react";

type SeoSettings = {
  id?: string;
  metaTitleTemplate?: string | null;
  metaDescriptionTemplate?: string | null;
  robotsTxt?: string | null;
  googleAnalyticsId?: string | null;
  facebookPixelId?: string | null;
  googleTagManagerId?: string | null;
  localBusinessSchema?: string | null;
};

type Redirect = { id: string; fromPath: string; toPath: string; type: number; createdAt: string };

const BLANK: SeoSettings = {
  metaTitleTemplate: "", metaDescriptionTemplate: "", robotsTxt: "",
  googleAnalyticsId: "", facebookPixelId: "", googleTagManagerId: "", localBusinessSchema: "",
};

function RedirectForm({ onSave, onCancel }: { onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ fromPath: "", toPath: "", type: "301" });
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>From Path *</Label>
        <Input value={form.fromPath} onChange={e => setForm(f => ({ ...f, fromPath: e.target.value }))} placeholder="/old-page" />
      </div>
      <div className="space-y-1.5">
        <Label>To Path *</Label>
        <Input value={form.toPath} onChange={e => setForm(f => ({ ...f, toPath: e.target.value }))} placeholder="/new-page" />
      </div>
      <div className="space-y-1.5">
        <Label>Type *</Label>
        <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="301">301 — Permanent</SelectItem>
            <SelectItem value="302">302 — Temporary</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ fromPath: form.fromPath, toPath: form.toPath, type: Number(form.type) })} disabled={!form.fromPath || !form.toPath}>Add Redirect</Button>
      </div>
    </div>
  );
}

export default function AdminCmsSeo() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<SeoSettings>(BLANK);
  const [redirectDialog, setRedirectDialog] = useState(false);

  const { data: seo, isLoading } = useQuery<SeoSettings | null>({
    queryKey: ["/v1/cms/seo"],
    queryFn: () => api.get("/cms/seo"),
  });

  const { data: redirects, isLoading: redirectsLoading } = useQuery<Redirect[]>({
    queryKey: ["/v1/cms/seo/redirects"],
    queryFn: () => api.get("/cms/seo/redirects"),
  });

  useEffect(() => {
    if (seo) setForm({ ...BLANK, ...seo });
  }, [seo]);

  const set = (k: keyof SeoSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const saveMut = useMutation({
    mutationFn: (d: SeoSettings) => api.put("/cms/seo", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/v1/cms/seo"] }); toast({ title: "SEO settings saved" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const refreshRedirects = () => qc.invalidateQueries({ queryKey: ["/v1/cms/seo/redirects"] });
  const createRedirect = useMutation({ mutationFn: (d: any) => api.post("/cms/seo/redirects", d), onSuccess: () => { refreshRedirects(); setRedirectDialog(false); toast({ title: "Redirect added" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });
  const deleteRedirect = useMutation({ mutationFn: (id: string) => api.delete(`/cms/seo/redirects/${id}`), onSuccess: () => { refreshRedirects(); toast({ title: "Redirect deleted" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO Management</h1>
        <p className="text-muted-foreground mt-1">Configure meta templates, analytics, and URL redirects.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="redirects">Redirects</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 pt-4">
          {isLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
          ) : (
            <>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4" /> Meta Templates</CardTitle>
                  <CardDescription>Use placeholders like {"{title}"} and {"{company}"}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Meta Title Template</Label>
                    <Input value={form.metaTitleTemplate ?? ""} onChange={set("metaTitleTemplate")} placeholder="{title} | {company}" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meta Description Template</Label>
                    <Textarea value={form.metaDescriptionTemplate ?? ""} onChange={set("metaDescriptionTemplate")} placeholder="{title} — explore tours and packages with {company}." rows={2} />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Analytics &amp; Tracking</CardTitle>
                  <CardDescription>Connect analytics and pixel tracking IDs.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Google Analytics ID</Label>
                    <Input value={form.googleAnalyticsId ?? ""} onChange={set("googleAnalyticsId")} placeholder="G-XXXXXXXXXX" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Facebook Pixel ID</Label>
                    <Input value={form.facebookPixelId ?? ""} onChange={set("facebookPixelId")} placeholder="123456789012345" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Google Tag Manager ID</Label>
                    <Input value={form.googleTagManagerId ?? ""} onChange={set("googleTagManagerId")} placeholder="GTM-XXXXXXX" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">robots.txt</CardTitle>
                  <CardDescription>Control how search engines crawl your site.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea value={form.robotsTxt ?? ""} onChange={set("robotsTxt")} placeholder={"User-agent: *\nAllow: /"} rows={5} className="font-mono text-xs" />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Local Business Schema (JSON-LD)</CardTitle>
                  <CardDescription>Structured data for rich search results.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea value={form.localBusinessSchema ?? ""} onChange={set("localBusinessSchema")} placeholder='{"@context":"https://schema.org","@type":"TravelAgency"}' rows={6} className="font-mono text-xs" />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} className="gap-2">
                  <Save className="h-4 w-4" /> {saveMut.isPending ? "Saving…" : "Save SEO Settings"}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="redirects" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage 301/302 URL redirects.</p>
            <Button onClick={() => setRedirectDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> New Redirect</Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              {redirectsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !redirects?.length ? (
                <div className="text-center py-12">
                  <ArrowRight className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">No redirects yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Add a redirect to forward old URLs.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redirects.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.fromPath}</TableCell>
                        <TableCell className="font-mono text-xs">{r.toPath}</TableCell>
                        <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete redirect ${r.fromPath}?`)) deleteRedirect.mutate(r.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={redirectDialog} onOpenChange={() => setRedirectDialog(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Redirect</DialogTitle></DialogHeader>
          {redirectDialog && <RedirectForm onSave={d => createRedirect.mutate(d)} onCancel={() => setRedirectDialog(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
