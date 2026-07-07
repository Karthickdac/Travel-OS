import { useEffect, useState } from "react";
import {
  useListTripRates,
  useCreateTripRate,
  useUpdateTripRate,
  useDeleteTripRate,
  useGetTripEstimatorSettings,
  useUpdateTripEstimatorSettings,
  getListTripRatesQueryKey,
  getGetTripEstimatorSettingsQueryKey,
} from "@workspace/api-client-react";
import type { TripRate } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Calculator, Plus, Pencil, Trash2, Car, Route as RouteIcon, CalendarDays } from "lucide-react";

const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;

type RateForm = {
  vehicleType: string;
  vehicleExamples: string;
  seats: string;
  ratePerKm: string;
  nonAcRatePerKm: string;
  nonAcDayRate: string;
  nonAcExtraKmRate: string;
  minKmPerDay: string;
  dayRate: string;
  kmIncludedPerDay: string;
  extraKmRate: string;
  driverBataPerDay: string;
  nightHaltCharge: string;
  notes: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY_FORM: RateForm = {
  vehicleType: "",
  vehicleExamples: "",
  seats: "",
  ratePerKm: "0",
  nonAcRatePerKm: "0",
  nonAcDayRate: "0",
  nonAcExtraKmRate: "0",
  minKmPerDay: "0",
  dayRate: "0",
  kmIncludedPerDay: "0",
  extraKmRate: "0",
  driverBataPerDay: "0",
  nightHaltCharge: "0",
  notes: "",
  sortOrder: "0",
  isActive: true,
};

function toForm(r: TripRate): RateForm {
  return {
    vehicleType: r.vehicleType,
    vehicleExamples: r.vehicleExamples ?? "",
    seats: r.seats != null ? String(r.seats) : "",
    ratePerKm: String(r.ratePerKm),
    nonAcRatePerKm: String(r.nonAcRatePerKm),
    nonAcDayRate: String(r.nonAcDayRate),
    nonAcExtraKmRate: String(r.nonAcExtraKmRate),
    minKmPerDay: String(r.minKmPerDay),
    dayRate: String(r.dayRate),
    kmIncludedPerDay: String(r.kmIncludedPerDay),
    extraKmRate: String(r.extraKmRate),
    driverBataPerDay: String(r.driverBataPerDay),
    nightHaltCharge: String(r.nightHaltCharge),
    notes: r.notes ?? "",
    sortOrder: String(r.sortOrder),
    isActive: r.isActive,
  };
}

export default function AdminTripRates() {
  const { data: rates, isLoading } = useListTripRates();
  const { data: settings, isLoading: settingsLoading } = useGetTripEstimatorSettings();
  const createRate = useCreateTripRate();
  const updateRate = useUpdateTripRate();
  const deleteRate = useDeleteTripRate();
  const updateSettings = useUpdateTripEstimatorSettings();
  const { toast } = useToast();
  const qc = useQueryClient();

  const refreshRates = () => qc.invalidateQueries({ queryKey: getListTripRatesQueryKey() });
  const refreshSettings = () => qc.invalidateQueries({ queryKey: getGetTripEstimatorSettingsQueryKey() });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TripRate | null>(null);
  const [form, setForm] = useState<RateForm>({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<TripRate | null>(null);

  const [settingsForm, setSettingsForm] = useState({
    enabled: true,
    allowOneWay: true,
    allowRoundTrip: true,
    gstPercent: "0",
    tollNote: "",
    termsNote: "",
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        enabled: settings.enabled,
        allowOneWay: settings.allowOneWay,
        allowRoundTrip: settings.allowRoundTrip,
        gstPercent: String(settings.gstPercent),
        tollNote: settings.tollNote ?? "",
        termsNote: settings.termsNote ?? "",
      });
    }
  }, [settings]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: String((rates?.length ?? 0) + 1) });
    setDialogOpen(true);
  };

  const openEdit = (r: TripRate) => {
    setEditing(r);
    setForm(toForm(r));
    setDialogOpen(true);
  };

  const setF = (k: keyof RateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSaveRate = async () => {
    if (!form.vehicleType.trim()) {
      toast({ title: "Vehicle type is required", variant: "destructive" });
      return;
    }
    const payload = {
      vehicleType: form.vehicleType.trim(),
      vehicleExamples: form.vehicleExamples.trim() || undefined,
      seats: form.seats ? Number(form.seats) : undefined,
      ratePerKm: Number(form.ratePerKm) || 0,
      nonAcRatePerKm: Number(form.nonAcRatePerKm) || 0,
      nonAcDayRate: Number(form.nonAcDayRate) || 0,
      nonAcExtraKmRate: Number(form.nonAcExtraKmRate) || 0,
      minKmPerDay: Number(form.minKmPerDay) || 0,
      dayRate: Number(form.dayRate) || 0,
      kmIncludedPerDay: Number(form.kmIncludedPerDay) || 0,
      extraKmRate: Number(form.extraKmRate) || 0,
      driverBataPerDay: Number(form.driverBataPerDay) || 0,
      nightHaltCharge: Number(form.nightHaltCharge) || 0,
      notes: form.notes.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await updateRate.mutateAsync({ id: editing.id, data: payload });
        toast({ title: "Vehicle rate updated" });
      } else {
        await createRate.mutateAsync({ data: payload });
        toast({ title: "Vehicle rate added" });
      }
      refreshRates();
      setDialogOpen(false);
    } catch {
      toast({ title: "Failed to save vehicle rate", variant: "destructive" });
    }
  };

  const handleToggleActive = async (r: TripRate, next: boolean) => {
    try {
      await updateRate.mutateAsync({ id: r.id, data: { isActive: next } });
      refreshRates();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRate.mutateAsync({ id: deleteTarget.id });
      toast({ title: "Vehicle rate deleted" });
      refreshRates();
      setDeleteTarget(null);
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsForm.allowOneWay && !settingsForm.allowRoundTrip) {
      toast({ title: "Enable at least one trip type (one way or round trip)", variant: "destructive" });
      return;
    }
    try {
      await updateSettings.mutateAsync({
        data: {
          enabled: settingsForm.enabled,
          allowOneWay: settingsForm.allowOneWay,
          allowRoundTrip: settingsForm.allowRoundTrip,
          gstPercent: Number(settingsForm.gstPercent) || 0,
          tollNote: settingsForm.tollNote.trim() || undefined,
          termsNote: settingsForm.termsNote.trim() || undefined,
        },
      });
      toast({ title: "Estimator settings saved" });
      refreshSettings();
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  };

  const sorted = [...(rates ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            Trip Rates
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure per-vehicle rates for the public trip fare estimator.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* General settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">Show estimator on website</Label>
                  <p className="text-sm text-muted-foreground">
                    When off, the public Trip Estimator page shows an unavailable state.
                  </p>
                </div>
                <Switch
                  checked={settingsForm.enabled}
                  onCheckedChange={(v) => setSettingsForm((s) => ({ ...s, enabled: v }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label className="text-base">Allow one-way trips</Label>
                    <p className="text-sm text-muted-foreground">
                      Customers can get one-way fare estimates.
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.allowOneWay}
                    onCheckedChange={(v) => setSettingsForm((s) => ({ ...s, allowOneWay: v }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label className="text-base">Allow round trips</Label>
                    <p className="text-sm text-muted-foreground">
                      Customers can get round-trip fare estimates.
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.allowRoundTrip}
                    onCheckedChange={(v) => setSettingsForm((s) => ({ ...s, allowRoundTrip: v }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>GST %</Label>
                  <Input
                    type="number"
                    value={settingsForm.gstPercent}
                    onChange={(e) => setSettingsForm((s) => ({ ...s, gstPercent: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Toll note</Label>
                <Input
                  value={settingsForm.tollNote}
                  onChange={(e) => setSettingsForm((s) => ({ ...s, tollNote: e.target.value }))}
                  placeholder="Toll, parking & permit charges extra at actuals"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Terms note</Label>
                <Textarea
                  rows={2}
                  value={settingsForm.termsNote}
                  onChange={(e) => setSettingsForm((s) => ({ ...s, termsNote: e.target.value }))}
                  placeholder="Final fare may vary based on actual route and timings."
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !sorted.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No vehicle rates yet</p>
            <Button onClick={openCreate} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Vehicle</th>
                  <th className="px-4 py-3 font-semibold">Seats</th>
                  <th className="px-4 py-3 font-semibold">₹/km</th>
                  <th className="px-4 py-3 font-semibold">Min km/day</th>
                  <th className="px-4 py-3 font-semibold">Day rate</th>
                  <th className="px-4 py-3 font-semibold">Km incl.</th>
                  <th className="px-4 py-3 font-semibold">Extra ₹/km</th>
                  <th className="px-4 py-3 font-semibold">Bata</th>
                  <th className="px-4 py-3 font-semibold">Night halt</th>
                  <th className="px-4 py-3 font-semibold">Active</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.vehicleType}</div>
                      {r.vehicleExamples && (
                        <div className="text-xs text-muted-foreground">{r.vehicleExamples}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{r.seats ?? "—"}</td>
                    <td className="px-4 py-3">
                      {inr(r.ratePerKm)}
                      {r.nonAcRatePerKm > 0 && (
                        <span className="text-muted-foreground"> / {inr(r.nonAcRatePerKm)} non-AC</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{r.minKmPerDay}</td>
                    <td className="px-4 py-3">{inr(r.dayRate)}</td>
                    <td className="px-4 py-3">{r.kmIncludedPerDay}</td>
                    <td className="px-4 py-3">{inr(r.extraKmRate)}</td>
                    <td className="px-4 py-3">{inr(r.driverBataPerDay)}</td>
                    <td className="px-4 py-3">{inr(r.nightHaltCharge)}</td>
                    <td className="px-4 py-3">
                      <Switch checked={r.isActive} onCheckedChange={(v) => handleToggleActive(r, v)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Vehicle Rate" : "Add Vehicle Rate"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Common */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Vehicle type *</Label>
                <Input value={form.vehicleType} onChange={setF("vehicleType")} placeholder="e.g. Sedan" />
              </div>
              <div className="space-y-1.5">
                <Label>Examples</Label>
                <Input value={form.vehicleExamples} onChange={setF("vehicleExamples")} placeholder="Swift Dzire, Etios" />
              </div>
              <div className="space-y-1.5">
                <Label>Seats</Label>
                <Input type="number" value={form.seats} onChange={setF("seats")} placeholder="4" />
              </div>
            </div>

            {/* KM Rental */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <RouteIcon className="h-4 w-4 text-primary" />
                Kilometre Rental (Outstation)
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Rate per km (₹)</Label>
                  <Input type="number" value={form.ratePerKm} onChange={setF("ratePerKm")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Minimum km per day</Label>
                  <Input type="number" value={form.minKmPerDay} onChange={setF("minKmPerDay")} />
                </div>
              </div>
            </div>

            {/* Day Rental */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <CalendarDays className="h-4 w-4 text-primary" />
                Day Rental (Local Package)
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Day rate (₹)</Label>
                  <Input type="number" value={form.dayRate} onChange={setF("dayRate")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Km included / day</Label>
                  <Input type="number" value={form.kmIncludedPerDay} onChange={setF("kmIncludedPerDay")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Extra km rate (₹)</Label>
                  <Input type="number" value={form.extraKmRate} onChange={setF("extraKmRate")} />
                </div>
              </div>
            </div>

            {/* Non-AC rates */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <Car className="h-4 w-4 text-primary" />
                Non-AC rates (optional)
              </div>
              <p className="text-sm text-muted-foreground">
                Leave 0 if Non-AC is not offered for this vehicle
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Non-AC ₹/km</Label>
                  <Input type="number" value={form.nonAcRatePerKm} onChange={setF("nonAcRatePerKm")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Non-AC day rate (₹)</Label>
                  <Input type="number" value={form.nonAcDayRate} onChange={setF("nonAcDayRate")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Non-AC extra km (₹)</Label>
                  <Input type="number" value={form.nonAcExtraKmRate} onChange={setF("nonAcExtraKmRate")} />
                </div>
              </div>
            </div>

            {/* Common charges */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Driver bata / day (₹)</Label>
                <Input type="number" value={form.driverBataPerDay} onChange={setF("driverBataPerDay")} />
              </div>
              <div className="space-y-1.5">
                <Label>Night halt charge (₹)</Label>
                <Input type="number" value={form.nightHaltCharge} onChange={setF("nightHaltCharge")} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input type="number" value={form.sortOrder} onChange={setF("sortOrder")} />
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                <Label>Active {form.isActive ? <Badge variant="outline" className="ml-1">Shown</Badge> : null}</Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={setF("notes")} placeholder="Any special notes for this vehicle" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRate} disabled={createRate.isPending || updateRate.isPending}>
              {editing ? "Save Changes" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vehicle rate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{deleteTarget?.vehicleType}” from the trip estimator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
