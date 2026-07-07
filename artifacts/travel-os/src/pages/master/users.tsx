import { useState } from "react";
import { useListMasterUsers, useSetUserCompanies, useListCompanies } from "@workspace/api-client-react";
import type { MasterUser } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListMasterUsersQueryKey } from "@workspace/api-client-react";
import { Users, Building2, Settings2 } from "lucide-react";

const ROLE_META: Record<string, { label: string; cls: string }> = {
  master_admin: { label: "Master Admin", cls: "bg-purple-100 text-purple-800 border-purple-200" },
  company_admin: { label: "Company Admin", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  company_staff: { label: "Staff", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  customer: { label: "Customer", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export default function MasterUsers() {
  const { data: users, isLoading } = useListMasterUsers();
  const { data: companies } = useListCompanies();
  const setUserCompanies = useSetUserCompanies();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogUser, setDialogUser] = useState<MasterUser | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const companyList = companies?.data ?? [];
  const companyName = (id: string) => companyList.find(c => c.id === id)?.name ?? id;

  const assignedIds = (u: MasterUser) => {
    const set = new Set<string>(u.companyIds ?? []);
    if (u.companyId) set.add(u.companyId);
    return Array.from(set);
  };

  const openManage = (u: MasterUser) => {
    setChecked(new Set(assignedIds(u)));
    setDialogUser(u);
  };

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!dialogUser) return;
    try {
      await setUserCompanies.mutateAsync({ id: dialogUser.id, data: { companyIds: Array.from(checked) } });
      toast({ title: "Sites updated" });
      qc.invalidateQueries({ queryKey: getListMasterUsersQueryKey() });
      setDialogUser(null);
    } catch {
      toast({ title: "Failed to update sites", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage users and group companies under a single login.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : !users?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Companies</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => {
                  const roleMeta = ROLE_META[u.role] ?? { label: u.role, cls: "bg-gray-100 text-gray-700 border-gray-200" };
                  const isMaster = u.role === "master_admin";
                  const assigned = assignedIds(u);
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleMeta.cls}`}>{roleMeta.label}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u.isActive ? "text-emerald-700 border-emerald-200" : "text-gray-500"}>
                          {u.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {assigned.length ? assigned.map(id => (
                            <Badge key={id} variant="secondary" className="text-xs gap-1">
                              <Building2 className="h-3 w-3" />{companyName(id)}
                            </Badge>
                          )) : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          disabled={isMaster}
                          onClick={() => openManage(u)}
                        >
                          <Settings2 className="h-3 w-3" />Manage sites
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!dialogUser} onOpenChange={() => setDialogUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Manage sites — {dialogUser?.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Select the companies this user can access and switch between.</p>
          <div className="max-h-80 overflow-y-auto space-y-1 border rounded-md p-2">
            {companyList.map(c => (
              <label key={c.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer">
                <Checkbox checked={checked.has(c.id)} onCheckedChange={() => toggle(c.id)} />
                <span className="text-sm">{c.name}</span>
              </label>
            ))}
            {!companyList.length && <p className="text-sm text-muted-foreground px-2 py-2">No companies available.</p>}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setDialogUser(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={setUserCompanies.isPending}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
