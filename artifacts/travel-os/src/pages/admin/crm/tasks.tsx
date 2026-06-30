import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ListTodo, Plus, Pencil, Trash2, CheckCircle2, Clock, AlertTriangle, Calendar, User, Search } from "lucide-react";

type Task = {
  id: string;
  leadId?: string | null;
  title: string;
  relatedTo?: string | null;
  assignedTo?: string | null;
  dueDate: string;
  priority: string;
  status: string;
  notes?: string | null;
  createdAt: string;
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 border-gray-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const BLANK = {
  title: "", relatedTo: "", assignedTo: "", dueDate: "", priority: "medium", status: "pending", notes: "",
};

function TaskForm({ initial, onSave, onCancel, saving }: { initial?: any; onSave: (d: any) => void; onCancel: () => void; saving: boolean }) {
  const [form, setForm] = useState<Record<string, any>>({ ...BLANK, ...initial });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Title *</Label>
          <Input value={form.title} onChange={set("title")} placeholder="Call customer to confirm itinerary" />
        </div>
        <div className="space-y-1.5">
          <Label>Related To</Label>
          <Input value={form.relatedTo} onChange={set("relatedTo")} placeholder="Customer / lead name" />
        </div>
        <div className="space-y-1.5">
          <Label>Assigned To</Label>
          <Input value={form.assignedTo} onChange={set("assignedTo")} placeholder="Staff name" />
        </div>
        <div className="space-y-1.5">
          <Label>Due Date *</Label>
          <Input type="date" value={form.dueDate} onChange={set("dueDate")} />
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {initial?.id && (
          <div className="space-y-1.5 col-span-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5 col-span-2">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={set("notes")} placeholder="Additional details…" rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, relatedTo: form.relatedTo || undefined, assignedTo: form.assignedTo || undefined, notes: form.notes || undefined })} disabled={!form.title || !form.dueDate || saving}>
          {initial?.id ? "Save Changes" : "Create Task"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminCrmTasks() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data?: Task } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/v1/crm/tasks"],
    queryFn: () => api.get("/crm/tasks"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/crm/tasks"] });

  const createMut = useMutation({ mutationFn: (d: any) => api.post("/crm/tasks", d), onSuccess: () => { refresh(); setDialog(null); toast({ title: "Task created" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, ...d }: any) => api.patch(`/crm/tasks/${id}`, d), onSuccess: () => { refresh(); setDialog(null); toast({ title: "Task updated" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: string) => api.delete(`/crm/tasks/${id}`), onSuccess: () => { refresh(); toast({ title: "Task deleted" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });

  const handleSave = (d: any) => {
    if (dialog?.mode === "edit" && dialog.data) updateMut.mutate({ id: dialog.data.id, ...d });
    else createMut.mutate(d);
  };

  const markComplete = (t: Task) => updateMut.mutate({ id: t.id, status: "completed" });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isOverdue = (t: Task) => t.status === "pending" && new Date(t.dueDate) < today;

  const filtered = (tasks ?? []).filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = !search || t.title.toLowerCase().includes(q) || (t.relatedTo ?? "").toLowerCase().includes(q) || (t.assignedTo ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tasks?.length ?? 0,
    pending: (tasks ?? []).filter((t) => t.status === "pending").length,
    overdue: (tasks ?? []).filter(isOverdue).length,
    completed: (tasks ?? []).filter((t) => t.status === "completed").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Follow-up Tasks</h1>
          <p className="text-muted-foreground mt-1">Track and complete CRM follow-ups and reminders.</p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })} className="gap-2">
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: stats.total, cls: "bg-primary/10 text-primary", icon: <ListTodo className="h-4 w-4" /> },
          { label: "Pending", value: stats.pending, cls: "bg-blue-100 text-blue-700", icon: <Clock className="h-4 w-4" /> },
          { label: "Overdue", value: stats.overdue, cls: "bg-red-100 text-red-700", icon: <AlertTriangle className="h-4 w-4" /> },
          { label: "Completed", value: stats.completed, cls: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" /> },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.cls}`}>{s.icon}</div>
              <div><p className="text-2xl font-black">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : !filtered.length ? (
        <Card className="text-center py-16">
          <CardContent className="pt-6">
            <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search || statusFilter !== "all" ? "No tasks match" : "No tasks yet"}</p>
            {!search && statusFilter === "all" && <Button onClick={() => setDialog({ mode: "create" })} className="mt-4 gap-2"><Plus className="h-4 w-4" />New Task</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const overdue = isOverdue(t);
            return (
              <Card key={t.id} className={`shadow-sm hover:shadow-md transition-shadow ${t.status === "completed" || t.status === "cancelled" ? "opacity-70" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-sm ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                        <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[t.priority] ?? ""}`}>{t.priority}</Badge>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[t.status] ?? ""}`}>{t.status}</Badge>
                        {overdue && <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200 gap-1"><AlertTriangle className="h-3 w-3" />Overdue</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                        <span className={`flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : ""}`}><Calendar className="h-3 w-3" />{new Date(t.dueDate).toLocaleDateString()}</span>
                        {t.relatedTo && <span className="flex items-center gap-1"><User className="h-3 w-3" />{t.relatedTo}</span>}
                        {t.assignedTo && <span className="flex items-center gap-1">Assigned: {t.assignedTo}</span>}
                      </div>
                      {t.notes && <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-1">{t.notes}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {t.status === "pending" && <Button size="sm" variant="ghost" onClick={() => markComplete(t)} className="h-8 text-xs gap-1 text-emerald-600 hover:text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Complete</Button>}
                      <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "edit", data: t })} className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete task "${t.title}"?`)) deleteMut.mutate(t.id); }} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          {dialog && <TaskForm initial={dialog.data} onSave={handleSave} onCancel={() => setDialog(null)} saving={createMut.isPending || updateMut.isPending} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
