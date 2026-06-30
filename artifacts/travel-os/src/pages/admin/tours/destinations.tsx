import { useState } from "react";
import { useListDestinations, useCreateDestination, useListTourPackages } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Map, Package, Plus, Search, Globe2 } from "lucide-react";

const BLANK = { name: "", state: "", country: "India", description: "", tags: "" };

export default function AdminDestinations() {
  const { data: destinations, isLoading } = useListDestinations();
  const { data: packages } = useListTourPackages();
  const createDestination = useCreateDestination();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(BLANK);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/tours/destinations"] });

  const filtered = (destinations ?? []).filter(d => {
    const q = search.toLowerCase();
    return !search || d.name.toLowerCase().includes(q) || (d.state ?? "").toLowerCase().includes(q) || d.country.toLowerCase().includes(q);
  });

  const handleCreate = async () => {
    if (!form.name || !form.country) { toast({ title: "Name and country are required", variant: "destructive" }); return; }
    try {
      await createDestination.mutateAsync({ data: {
        name: form.name, state: form.state || undefined, country: form.country,
        description: form.description || undefined,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      }});
      toast({ title: "Destination added" });
      refresh();
      setCreateOpen(false);
      setForm(BLANK);
    } catch { toast({ title: "Failed to add destination", variant: "destructive" }); }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const pkgCountByDest = (destId: string) => (packages ?? []).filter(p => p.destinationId === destId).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Destinations</h1>
          <p className="text-muted-foreground mt-1">Manage travel destinations linked to tour packages.</p>
        </div>
        <Button onClick={() => { setForm(BLANK); setCreateOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />Add Destination
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search destinations…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : !filtered.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search ? "No destinations match" : "No destinations added yet"}</p>
            {!search && <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2"><Plus className="h-4 w-4" />Add Destination</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(d => {
            const pkgCount = pkgCountByDest(d.id);
            return (
              <Card key={d.id} className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Map className="h-10 w-10 text-primary/40" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>{d.name}</span>
                    {pkgCount > 0 && (
                      <Badge variant="secondary" className="text-xs gap-1 font-normal">
                        <Package className="h-3 w-3" />{pkgCount}
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Globe2 className="h-3.5 w-3.5" />
                    {[d.state, d.country].filter(Boolean).join(", ")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {d.description && <p className="text-xs text-muted-foreground line-clamp-2">{d.description}</p>}
                  {d.tags && d.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {d.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {pkgCount === 0 && <p className="text-xs text-muted-foreground pt-1 border-t border-border">No packages yet</p>}
                  {pkgCount > 0 && <p className="text-xs text-muted-foreground pt-1 border-t border-border">{pkgCount} package{pkgCount > 1 ? "s" : ""} available</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Destination</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Destination Name *</Label><Input value={form.name} onChange={setF("name")} placeholder="e.g. Ooty" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>State</Label><Input value={form.state} onChange={setF("state")} placeholder="Tamil Nadu" /></div>
              <div className="space-y-1.5"><Label>Country *</Label><Input value={form.country} onChange={setF("country")} placeholder="India" /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={setF("description")} rows={2} placeholder="Brief description…" /></div>
            <div className="space-y-1.5"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={setF("tags")} placeholder="hills, nature, honeymoon" /></div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createDestination.isPending}>Add Destination</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
