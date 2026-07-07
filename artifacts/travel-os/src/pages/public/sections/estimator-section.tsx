import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Calculator, MapPin, Route, Car, Snowflake, Fan, Loader2, ArrowRight, Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useGetPublicTripRates, useGetRouteDistance } from "@workspace/api-client-react";
import type { TripRate } from "@workspace/api-client-react";
import { getSiteDomain } from "@/lib/site-domain";
import { PlaceField, type Place } from "@/components/place-field";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainer } from "./_shared";

const SITE_DOMAIN = getSiteDomain();

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const fmt = (n: number) => inr.format(Math.round(n || 0));
const num = new Intl.NumberFormat("en-IN");

export default function EstimatorSection() {
  const [, navigate] = useLocation();
  const { data } = useGetPublicTripRates({ domain: SITE_DOMAIN });
  const settings = data?.settings;
  const rates = useMemo(() => data?.rates ?? [], [data?.rates]);

  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [roundTrip, setRoundTrip] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acMode, setAcMode] = useState<"ac" | "nonac">("ac");

  useEffect(() => {
    if (!selectedId && rates.length > 0) setSelectedId(rates[0].id);
  }, [rates, selectedId]);

  const selected: TripRate | undefined = useMemo(
    () => rates.find((r) => r.id === selectedId) ?? rates[0],
    [rates, selectedId],
  );

  const canNonAc = !!selected && selected.nonAcRatePerKm > 0;
  useEffect(() => {
    if (!canNonAc && acMode === "nonac") setAcMode("ac");
  }, [canNonAc, acMode]);

  const bothChosen = !!from && !!to;
  const { data: route, isFetching: routeLoading } = useGetRouteDistance(
    {
      fromLat: from?.lat ?? 0,
      fromLng: from?.lng ?? 0,
      toLat: to?.lat ?? 0,
      toLng: to?.lng ?? 0,
    },
    { query: { enabled: bothChosen } as any },
  );

  const oneWayKm = bothChosen && route ? route.distanceKm : null;
  const totalKm = oneWayKm != null ? Math.round((roundTrip ? oneWayKm * 2 : oneWayKm) * 10) / 10 : null;

  const estimate = useMemo(() => {
    if (!selected || totalKm == null) return null;
    const ac = acMode === "ac";
    const ratePerKm = ac || selected.nonAcRatePerKm <= 0 ? selected.ratePerKm : selected.nonAcRatePerKm;
    const gstPercent = settings?.gstPercent ?? 0;
    const days = Math.max(1, Math.ceil(totalKm / Math.max(selected.minKmPerDay, 1)));
    const nights = Math.max(days - 1, 0);
    const billedKm = Math.max(totalKm, days * selected.minKmPerDay);
    const subtotal =
      billedKm * ratePerKm +
      days * selected.driverBataPerDay +
      nights * selected.nightHaltCharge;
    const gst = (subtotal * gstPercent) / 100;
    return { total: subtotal + gst, days };
  }, [selected, totalKm, acMode, settings?.gstPercent]);

  if (settings?.enabled === false || rates.length === 0) return null;

  return (
    <section className="py-20 bg-white relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-10 max-w-2xl mx-auto"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer(0.1)}
        >
          <motion.p variants={fadeUp} className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-3">
            Instant Fare
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            Estimate Your Trip
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg">
            Pick your route and vehicle — get an instant fare estimate.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto bg-[#FAF8F5] border border-border/60 rounded-3xl shadow-sm p-6 md:p-8"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5 mb-2">
                <MapPin className="w-4 h-4 text-primary" /> From
              </label>
              <PlaceField place={from} onSelect={setFrom} placeholder="Pickup city or place" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5 mb-2">
                <MapPin className="w-4 h-4 text-primary" /> To
              </label>
              <PlaceField place={to} onSelect={setTo} placeholder="Drop city or place" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5 mb-2">
                <Car className="w-4 h-4 text-primary" /> Vehicle
              </label>
              <Select value={selected?.id ?? ""} onValueChange={setSelectedId}>
                <SelectTrigger className="h-12 rounded-xl bg-white">
                  <SelectValue placeholder="Choose a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {rates.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.vehicleType}
                      {r.seats ? ` (${r.seats} seater)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-[13px] font-bold text-muted-foreground mb-2 block">Comfort</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAcMode("ac")}
                    className={cn(
                      "h-12 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-bold transition-all",
                      acMode === "ac" ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-white text-muted-foreground",
                    )}
                  >
                    <Snowflake className="h-4 w-4" /> AC
                  </button>
                  <button
                    type="button"
                    onClick={() => canNonAc && setAcMode("nonac")}
                    disabled={!canNonAc}
                    className={cn(
                      "h-12 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-bold transition-all",
                      acMode === "nonac" ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-white text-muted-foreground",
                      !canNonAc && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    <Fan className="h-4 w-4" /> Non-AC
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Repeat className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Round trip</span>
              <Switch checked={roundTrip} onCheckedChange={setRoundTrip} />
            </label>
            {routeLoading && bothChosen && (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Calculating route…
              </span>
            )}
            {totalKm != null && !routeLoading && (
              <span className="inline-flex items-center gap-2 text-sm font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                <Route className="h-4 w-4" /> {num.format(totalKm)} km{roundTrip ? " round trip" : ""}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-border/60 pt-6">
            <div>
              {estimate ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estimated fare</p>
                  <p className="text-3xl font-black text-primary">{fmt(estimate.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    Incl. driver bata{estimate.days > 1 ? ` · approx ${estimate.days} days` : ""} · taxes as applicable
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  Choose From and To to see your fare instantly.
                </p>
              )}
            </div>
            <Button
              size="lg"
              className="h-14 px-8 rounded-full font-bold gap-2"
              onClick={() => navigate("/trip-estimator")}
            >
              Full estimate & booking <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
