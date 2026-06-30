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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Menu as MenuIcon, Plus, Trash2, Link2, ExternalLink } from "lucide-react";

type MenuItem = {
  id: string; menuId: string; label: string; url: string; target: string;
  parentId?: string | null; sortOrder: number; isVisible: boolean;
};

type Menu = {
  id: string; name: string; menuType: string; isActive: boolean;
  items: MenuItem[];
};

const MENU_TYPES = [
  { value: "primary", label: "Primary" },
  { value: "footer", label: "Footer" },
  { value: "mobile", label: "Mobile" },
];

function MenuForm({ onSave, onCancel }: { onSave: (d: any) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [menuType, setMenuType] = useState("primary");
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Menu Name *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Main Navigation" />
      </div>
      <div className="space-y-1.5">
        <Label>Location *</Label>
        <Select value={menuType} onValueChange={setMenuType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MENU_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ name, menuType })} disabled={!name}>Create Menu</Button>
      </div>
    </div>
  );
}

function ItemForm({ onSave, onCancel }: { onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ label: "", url: "", sortOrder: "" });
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Label *</Label>
        <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Home" />
      </div>
      <div className="space-y-1.5">
        <Label>URL *</Label>
        <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="/ or https://…" />
      </div>
      <div className="space-y-1.5">
        <Label>Sort Order</Label>
        <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} placeholder="0" min="0" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ label: form.label, url: form.url, sortOrder: form.sortOrder ? Number(form.sortOrder) : 0 })} disabled={!form.label || !form.url}>Add Item</Button>
      </div>
    </div>
  );
}

export default function AdminCmsMenus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [menuDialog, setMenuDialog] = useState(false);
  const [itemDialog, setItemDialog] = useState<string | null>(null);

  const { data: menus, isLoading } = useQuery<Menu[]>({
    queryKey: ["/v1/cms/menus"],
    queryFn: () => api.get("/cms/menus"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/cms/menus"] });

  const createMenu = useMutation({ mutationFn: (d: any) => api.post("/cms/menus", d), onSuccess: () => { refresh(); setMenuDialog(false); toast({ title: "Menu created" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });
  const deleteMenu = useMutation({ mutationFn: (id: string) => api.delete(`/cms/menus/${id}`), onSuccess: () => { refresh(); toast({ title: "Menu deleted" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });
  const createItem = useMutation({ mutationFn: ({ menuId, ...d }: any) => api.post(`/cms/menus/${menuId}/items`, d), onSuccess: () => { refresh(); setItemDialog(null); toast({ title: "Item added" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });
  const deleteItem = useMutation({ mutationFn: (id: string) => api.delete(`/cms/menu-items/${id}`), onSuccess: () => { refresh(); toast({ title: "Item removed" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });

  const totalItems = (menus ?? []).reduce((s, m) => s + (m.items?.length ?? 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Navigation Menus</h1>
          <p className="text-muted-foreground mt-1">Manage your website navigation menus and links.</p>
        </div>
        <Button onClick={() => setMenuDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Menu
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Menus</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{menus?.length ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Links</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totalItems}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Menus</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{(menus ?? []).filter(m => m.isActive).length}</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}</div>
      ) : !menus?.length ? (
        <Card className="text-center py-16"><CardContent className="pt-6"><MenuIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No menus yet</p><p className="text-sm text-muted-foreground mt-1">Create your first navigation menu.</p></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {menus.map(m => (
            <Card key={m.id} className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2"><MenuIcon className="h-4 w-4 text-muted-foreground" />{m.name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{MENU_TYPES.find(t => t.value === m.menuType)?.label ?? m.menuType}</Badge>
                      {m.isActive ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge> : <Badge variant="outline" className="bg-gray-100 text-gray-600">Inactive</Badge>}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete menu "${m.name}" and all its items?`)) deleteMenu.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {!m.items?.length ? (
                  <p className="text-sm text-muted-foreground py-2">No links in this menu.</p>
                ) : (
                  <div className="space-y-1.5">
                    {[...m.items].sort((a, b) => a.sortOrder - b.sortOrder).map(it => (
                      <div key={it.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate flex items-center gap-1.5">
                            {it.target === "_blank" ? <ExternalLink className="h-3 w-3 text-muted-foreground" /> : <Link2 className="h-3 w-3 text-muted-foreground" />}
                            {it.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate font-mono">{it.url}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => { if (confirm(`Remove "${it.label}"?`)) deleteItem.mutate(it.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button size="sm" variant="outline" className="w-full mt-2 gap-2" onClick={() => setItemDialog(m.id)}><Plus className="h-3.5 w-3.5" /> Add Link</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={menuDialog} onOpenChange={() => setMenuDialog(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Menu</DialogTitle></DialogHeader>
          {menuDialog && <MenuForm onSave={d => createMenu.mutate(d)} onCancel={() => setMenuDialog(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemDialog} onOpenChange={() => setItemDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Menu Link</DialogTitle></DialogHeader>
          {itemDialog && <ItemForm onSave={d => createItem.mutate({ menuId: itemDialog, ...d })} onCancel={() => setItemDialog(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
