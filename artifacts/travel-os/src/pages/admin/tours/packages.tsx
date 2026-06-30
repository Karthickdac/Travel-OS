import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListTourPackages, useCreateTourPackage, useUpdateTourPackage, useDeleteTourPackage } from "@workspace/api-client-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/ui/image-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PackageOpen, Plus, Pencil, Trash2, Star, Clock, MapPin, CalendarDays, Check, ChevronDown, Sunrise } from "lucide-react";

const PKG_BLANK = { title: "", description: "", duration: "1", price: "", originalPrice: "", destinationName: "", imageUrl: "", packageType: "adventure", inclusions: "", exclusions: "", highlights: "", isActive: true };

function PackageForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    ...PKG_BLANK, ...initial,
    inclusions: (initial?.inclusions ?? []).join("\n"),
    exclusions: (initial?.exclusions ?? []).join("\n"),
    highlights: (initial?.highlights ?? []).join("\n"),
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f: any) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2"><Label>Package Title *</Label><Input value={form.title} onChange={set("title")} placeholder="Ooty & Kodaikanal 4D/3N" /></div>
        <div className="space-y-1.5"><Label>Price (₹) *</Label><Input type="number" value={form.price} onChange={set("price")} placeholder="12999" /></div>
        <div className="space-y-1.5"><Label>Original Price (₹)</Label><Input type="number" value={form.originalPrice} onChange={set("originalPrice")} placeholder="15999" /></div>
        <div className="space-y-1.5"><Label>Duration (days) *</Label><Input type="number" value={form.duration} onChange={set("duration")} min="1" /></div>
        <div className="space-y-1.5">
          <Label>Package Type</Label>
          <Select value={form.packageType} onValueChange={v => setForm((f: any) => ({ ...f, packageType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["adventure","beach","hill","pilgrimage","heritage","wildlife","honeymoon","family","group","international"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Destination</Label><Input value={form.destinationName} onChange={set("destinationName")} placeholder="Kodaikanal, Tamil Nadu" /></div>
        <div className="space-y-1.5"><Label>Cover Image</Label><ImageUpload value={form.imageUrl} onChange={url => setForm((f: any) => ({ ...f, imageUrl: url }))} /></div>
        <div className="space-y-1.5 col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={set("description")} rows={2} /></div>
        <div className="space-y-1.5"><Label>Inclusions (one per line)</Label><Textarea value={form.inclusions} onChange={set("inclusions")} rows={4} placeholder={"AC Vehicle\nDriver Allowance\nHotel (4N)"} /></div>
        <div className="space-y-1.5"><Label>Exclusions (one per line)</Label><Textarea value={form.exclusions} onChange={set("exclusions")} rows={4} placeholder={"Airfare\nPersonal expenses"} /></div>
        <div className="space-y-1.5 col-span-2"><Label>Highlights (one per line)</Label><Textarea value={form.highlights} onChange={set("highlights")} rows={3} placeholder={"Sunset at Coaker\nBoat ride at Kodai Lake"} /></div>
        <div className="flex items-center gap-2 col-span-2"><Switch checked={form.isActive} onCheckedChange={v => setForm((f: any) => ({ ...f, isActive: v }))} /><Label>Active (show on website)</Label></div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSave({
            ...form,
            price: Number(form.price),
            originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
            duration: Number(form.duration),
            inclusions: form.inclusions.split("\n").filter(Boolean),
            exclusions: form.exclusions.split("\n").filter(Boolean),
            highlights: form.highlights.split("\n").filter(Boolean),
          })}
          disabled={!form.title || !form.price}
        >{initial?.id ? "Save Changes" : "Create Package"}</Button>
      </div>
    </div>
  );
}

function ItineraryTab({ packageId }: { packageId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [addDay, setAddDay] = useState(false);
  const [dayForm, setDayForm] = useState({ dayNumber: "1", title: "", description: "", accommodation: "", meals: "", activities: "", transport: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDayForm(f => ({ ...f, [k]: e.target.value }));

  const { data: itinerary, isLoading } = useQuery<any[]>({
    queryKey: [`/v1/tours/packages/${packageId}/itinerary`],
    queryFn: () => api.get(`/tours/packages/${packageId}/itinerary`),
  });
  const addMut = useMutation({
    mutationFn: (d: any) => api.post(`/tours/packages/${packageId}/itinerary`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/v1/tours/packages/${packageId}/itinerary`] });
      setAddDay(false);
      setDayForm(f => ({ ...f, dayNumber: String((itinerary?.length ?? 0) + 2), title: "", description: "", accommodation: "", meals: "", activities: "", transport: "" }));
      toast({ title: "Day added" });
    },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/tours/itinerary/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`/v1/tours/packages/${packageId}/itinerary`] }),
  });

  return (
    <div className="space-y-4 mt-2">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setDayForm(f => ({ ...f, dayNumber: String((itinerary?.length ?? 0) + 1) })); setAddDay(true); }} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />Add Day
        </Button>
      </div>
      {isLoading ? <Skeleton className="h-24" /> : !itinerary?.length ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Sunrise className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No itinerary days yet. Add Day 1 to start building the itinerary.
        </div>
      ) : (
        <div className="space-y-3">
          {itinerary.map(day => (
            <Card key={day.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <div className="text-center"><div className="text-xs font-medium text-primary">Day</div><div className="text-lg font-bold text-primary leading-tight">{day.dayNumber}</div></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{day.title}</p>
                      {day.description && <p className="text-sm text-muted-foreground mt-0.5">{day.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {day.accommodation && <span>🏨 {day.accommodation}</span>}
                        {day.meals && <span>🍽️ {day.meals}</span>}
                        {day.transport && <span>🚗 {day.transport}</span>}
                        {day.activities && <span>🎯 {day.activities}</span>}
                      </div>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => { if (confirm("Delete this day?")) delMut.mutate(day.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {addDay && (
        <Card className="shadow-sm border-primary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Add Itinerary Day</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Day Number</Label><Input type="number" value={dayForm.dayNumber} onChange={set("dayNumber")} min="1" /></div>
              <div className="space-y-1"><Label className="text-xs">Title *</Label><Input value={dayForm.title} onChange={set("title")} placeholder="Arrival & Local Sightseeing" /></div>
              <div className="space-y-1 col-span-2"><Label className="text-xs">Description</Label><Textarea value={dayForm.description} onChange={set("description")} rows={2} /></div>
              <div className="space-y-1"><Label className="text-xs">Accommodation</Label><Input value={dayForm.accommodation} onChange={set("accommodation")} placeholder="Hotel name" /></div>
              <div className="space-y-1"><Label className="text-xs">Meals</Label><Input value={dayForm.meals} onChange={set("meals")} placeholder="Breakfast, Dinner" /></div>
              <div className="space-y-1"><Label className="text-xs">Transport</Label><Input value={dayForm.transport} onChange={set("transport")} placeholder="AC Innova" /></div>
              <div className="space-y-1"><Label className="text-xs">Activities</Label><Input value={dayForm.activities} onChange={set("activities")} placeholder="Boat ride, Hiking" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => setAddDay(false)}>Cancel</Button>
              <Button size="sm" onClick={() => addMut.mutate({ ...dayForm, dayNumber: Number(dayForm.dayNumber) })} disabled={!dayForm.title}>Add Day</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AvailabilityTab({ packageId }: { packageId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState("10");
  const [isBlackout, setIsBlackout] = useState(false);
  const { data: availability, isLoading } = useQuery<any[]>({
    queryKey: [`/v1/tours/packages/${packageId}/availability`],
    queryFn: () => api.get(`/tours/packages/${packageId}/availability`),
  });
  const saveMut = useMutation({
    mutationFn: (d: any) => api.post(`/tours/packages/${packageId}/availability`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`/v1/tours/packages/${packageId}/availability`] }); toast({ title: "Availability saved" }); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/tours/availability/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`/v1/tours/packages/${packageId}/availability`] }),
  });

  return (
    <div className="space-y-4 mt-2">
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Available Slots</Label><Input type="number" value={slots} onChange={e => setSlots(e.target.value)} min="0" className="w-28" /></div>
            <div className="flex items-center gap-2"><Switch checked={isBlackout} onCheckedChange={setIsBlackout} /><Label className="text-xs">Blackout Date</Label></div>
            <Button size="sm" onClick={() => saveMut.mutate({ date, availableSlots: Number(slots), isBlackout })}>Save</Button>
          </div>
        </CardContent>
      </Card>
      {isLoading ? <Skeleton className="h-20" /> : !availability?.length ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />No availability set yet
        </div>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {availability.map((a: any) => (
            <div key={a.id} className={`rounded-lg p-2 text-center text-xs relative group cursor-pointer ${a.isBlackout ? "bg-red-100 text-red-700" : a.availableSlots === 0 ? "bg-gray-100 text-gray-500" : "bg-emerald-50 text-emerald-700"}`}>
              <div className="font-semibold">{a.date.slice(5)}</div>
              <div>{a.isBlackout ? "Blackout" : `${a.availableSlots} slots`}</div>
              <button className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 bg-destructive text-destructive-foreground rounded-full items-center justify-center text-[10px]" onClick={() => delMut.mutate(a.id)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPackages() {
  const { data: packages, isLoading } = useListTourPackages();
  const createPackage = useCreateTourPackage();
  const updatePackage = useUpdateTourPackage();
  const deletePackage = useDeleteTourPackage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; pkg?: any } | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState("itinerary");

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/tours/packages"] });

  const handleSave = async (data: any) => {
    try {
      if (dialog?.mode === "edit") { await updatePackage.mutateAsync({ id: dialog.pkg.id, data }); toast({ title: "Package updated" }); }
      else { await createPackage.mutateAsync({ data }); toast({ title: "Package created" }); }
      refresh(); setDialog(null);
    } catch (e: any) { toast({ title: e?.message ?? "Error", variant: "destructive" }); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await deletePackage.mutateAsync({ id }); toast({ title: "Package deleted" }); refresh(); }
    catch { toast({ title: "Error", variant: "destructive" }); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Tour Packages</h1><p className="text-muted-foreground mt-1">Manage packages, day-wise itineraries and availability calendars.</p></div>
        <Button onClick={() => setDialog({ mode: "create" })} className="gap-2"><Plus className="h-4 w-4" /> New Package</Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : !(packages ?? []).length ? (
        <Card className="text-center py-20"><CardContent className="pt-6"><PackageOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No tour packages yet</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {(packages ?? []).map(pkg => (
            <Card key={pkg.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {pkg.imageUrl && (
                    <img src={pkg.imageUrl} alt={pkg.title} className="w-24 h-20 rounded-lg object-cover flex-shrink-0"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-lg">{pkg.title}</p>
                          {pkg.packageType && <Badge variant="outline">{pkg.packageType}</Badge>}
                          {!pkg.isActive && <Badge variant="outline" className="bg-gray-100 text-gray-500">Inactive</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {pkg.destinationName && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{pkg.destinationName}</span>}
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{pkg.duration}D</span>
                          {pkg.rating && <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{pkg.rating}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xl font-bold text-primary">₹{Number(pkg.price).toLocaleString()}</span>
                          {pkg.originalPrice && <span className="text-sm line-through text-muted-foreground">₹{Number(pkg.originalPrice).toLocaleString()}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "edit", pkg })}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(pkg.id, pkg.title)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setSelected(selected?.id === pkg.id ? null : pkg)} className="gap-1">
                          {selected?.id === pkg.id ? "Close" : "Manage"}
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${selected?.id === pkg.id ? "rotate-180" : ""}`} />
                        </Button>
                      </div>
                    </div>
                    {pkg.inclusions && pkg.inclusions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(pkg.inclusions as string[]).slice(0, 4).map((inc: string) => (
                          <span key={inc} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5"><Check className="h-2.5 w-2.5" />{inc}</span>
                        ))}
                        {pkg.inclusions.length > 4 && <span className="text-xs text-muted-foreground">+{pkg.inclusions.length - 4} more</span>}
                      </div>
                    )}
                  </div>
                </div>
                {selected?.id === pkg.id && (
                  <div className="mt-4 border-t pt-4">
                    <Tabs value={detailTab} onValueChange={setDetailTab}>
                      <TabsList>
                        <TabsTrigger value="itinerary"><Sunrise className="h-3.5 w-3.5 mr-1.5" />Day-wise Itinerary</TabsTrigger>
                        <TabsTrigger value="availability"><CalendarDays className="h-3.5 w-3.5 mr-1.5" />Availability</TabsTrigger>
                      </TabsList>
                      <TabsContent value="itinerary"><ItineraryTab packageId={pkg.id} /></TabsContent>
                      <TabsContent value="availability"><AvailabilityTab packageId={pkg.id} /></TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{dialog?.mode === "edit" ? "Edit Package" : "New Tour Package"}</DialogTitle></DialogHeader>
          {dialog && <PackageForm initial={dialog.pkg} onSave={handleSave} onCancel={() => setDialog(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
