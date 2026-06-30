import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Users2, Mail, Shield, Plus, Phone, Pencil, Trash2, Search } from "lucide-react";

const ROLE_META: Record<string, { label: string; color: string }> = {
  company_admin: { label: "Admin", color: "bg-purple-100 text-purple-700 border-purple-200" },
  company_staff: { label: "Staff", color: "bg-blue-100 text-blue-700 border-blue-200" },
  master_admin: { label: "Master", color: "bg-red-100 text-red-700 border-red-200" },
};

const BLANK = { email: "", name: "", role: "company_staff", password: "", phone: "" };

export default function AdminUsers() {
  const { data: users, isLoading } = useListUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data: any } | null>(null);
  const [form, setForm] = useState(BLANK);
  const [editActive, setEditActive] = useState(true);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/users"] });

  const filtered = (users ?? []).filter(u => {
    const q = search.toLowerCase();
    return !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q);
  });

  const openCreate = () => { setForm(BLANK); setDialog({ mode: "create", data: null }); };
  const openEdit = (u: any) => {
    setForm({ email: u.email, name: u.name, role: u.role, password: "", phone: u.phone ?? "" });
    setEditActive(u.isActive ?? true);
    setDialog({ mode: "edit", data: u });
  };

  const handleSave = async () => {
    if (!form.email || !form.name) { toast({ title: "Email and name are required", variant: "destructive" }); return; }
    if (dialog?.mode === "create" && !form.password) { toast({ title: "Password is required", variant: "destructive" }); return; }
    try {
      if (dialog?.mode === "create") {
        await createUser.mutateAsync({ data: { email: form.email, name: form.name, role: form.role, password: form.password, phone: form.phone || undefined } });
        toast({ title: "Staff member added" });
      } else {
        await updateUser.mutateAsync({ id: dialog!.data.id, data: { name: form.name, role: form.role, phone: form.phone || undefined, isActive: editActive } });
        toast({ title: "Staff updated" });
      }
      refresh();
      setDialog(null);
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove staff member "${name}"?`)) return;
    try {
      await deleteUser.mutateAsync({ id });
      toast({ title: "Staff member removed" });
      refresh();
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff & Users</h1>
          <p className="text-muted-foreground mt-1">Manage team members and their portal access.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Staff</Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="font-semibold">{users?.length ?? 0} total</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-emerald-600 font-semibold">{(users ?? []).filter(u => u.isActive).length} active</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-purple-600 font-semibold">{(users ?? []).filter(u => u.role === "company_admin").length} admin</span>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, email or role…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !filtered.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search ? "No staff match" : "No staff members yet"}</p>
            {!search && <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="h-4 w-4" />Add Staff</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => {
            const role = ROLE_META[u.role] ?? { label: u.role, color: "bg-gray-100 text-gray-700 border-gray-200" };
            return (
              <Card key={u.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{u.name}</p>
                      <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</span>
                        {u.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{u.phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className={`text-xs gap-1 ${role.color}`}>
                        <Shield className="h-3 w-3" />{role.label}
                      </Badge>
                      <Badge variant="outline" className={u.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs" : "bg-gray-100 text-gray-600 text-xs"}>
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(u)} className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id, u.name)} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{dialog?.mode === "create" ? "Add Staff Member" : "Edit Staff"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.name} onChange={setF("name")} placeholder="Staff name" /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={setF("email")} placeholder="staff@company.com" disabled={dialog?.mode === "edit"} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={setF("phone")} placeholder="9876543210" /></div>
            {dialog?.mode === "create" && (
              <div className="space-y-1.5"><Label>Password *</Label><Input type="password" value={form.password} onChange={setF("password")} placeholder="Min. 8 characters" /></div>
            )}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_admin">Admin</SelectItem>
                  <SelectItem value="company_staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dialog?.mode === "edit" && (
              <div className="flex items-center gap-3">
                <Switch checked={editActive} onCheckedChange={setEditActive} />
                <Label>{editActive ? "Active" : "Inactive"}</Label>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createUser.isPending || updateUser.isPending}>
                {dialog?.mode === "create" ? "Add Staff" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
