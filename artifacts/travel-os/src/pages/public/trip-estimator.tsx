import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Calculator, MapPin, Route, CalendarDays, Users, Car, Info,
  Plus, Minus, Send, MessageCircle, Sparkles, Gauge, Snowflake, Fan,
  Loader2, ArrowRight, RotateCcw, Repeat,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  useGetPublicTripRates, useGetPublicCmsSettings,
  useGetRouteDistance,
} from "@workspace/api-client-react";
import type { TripRate } from "@workspace/api-client-react";
import { getSiteDomain } from "@/lib/site-domain";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { PlaceField, type Place } from "@/components/place-field";

const SITE_DOMAIN = getSiteDomain();

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const fmt = (n: number) => inr.format(Math.round(n || 0));
const num = new Intl.NumberFormat("en-IN");

type Mode = "day" | "km";
type AcMode = "ac" | "nonac";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

function formatDuration(minutes?: number | null): string | null {
  if (minutes == null || !Number.isFinite(minutes)) return null;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `~${h}h ${m}m`;
  return `~${m}m`;
}

// Non-AC is offered only when the rates needed for the CURRENT mode are configured,
// otherwise a partial non-AC setup could quote a zero fare.
const nonAcAvailable = (r: TripRate, mode: Mode) =>
  mode === "km" ? r.nonAcRatePerKm > 0 : r.nonAcDayRate > 0;

export default function PublicTripEstimator() {
  const [, navigate] = useLocation();
  const { data, isLoading } = useGetPublicTripRates({ domain: SITE_DOMAIN });
  const { data: cms } = useGetPublicCmsSettings({ domain: SITE_DOMAIN });
  const phone = cms?.phone || "";

  const settings = data?.settings;
  const rates = useMemo(() => data?.rates ?? [], [data?.rates]);

  const [mode, setMode] = useState<Mode>("km");
  const [acMode, setAcMode] = useState<AcMode>("ac");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manualDays, setManualDays] = useState(1);

  // Travel dates
  const [startDate, setStartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // Route selection
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [roundTrip, setRoundTrip] = useState(true);

  // Trip type availability from company settings
  const allowOneWay = settings?.allowOneWay ?? true;
  const allowRoundTrip = settings?.allowRoundTrip ?? true;
  useEffect(() => {
    if (!allowRoundTrip && roundTrip) setRoundTrip(false);
    if (!allowOneWay && !roundTrip) setRoundTrip(true);
  }, [allowOneWay, allowRoundTrip, roundTrip]);

  // Days derived from travel dates when both are chosen; otherwise the manual stepper.
  // Return date only counts when it is actually shown (round trip, or day-rental mode).
  const returnDateApplies = roundTrip || mode === "day";
  const dateDays = useMemo(() => {
    if (!startDate) return null;
    if (!returnDateApplies || !returnDate) return returnDateApplies ? null : 1;
    const s = new Date(`${startDate}T00:00:00`);
    const r = new Date(`${returnDate}T00:00:00`);
    if (Number.isNaN(s.getTime()) || Number.isNaN(r.getTime()) || r < s) return null;
    return Math.round((r.getTime() - s.getTime()) / 86_400_000) + 1;
  }, [startDate, returnDate, returnDateApplies]);
  const days = dateDays ?? manualDays;

  // Manual distance fallback / override
  const [manualMode, setManualMode] = useState(false);
  const [manualKm, setManualKm] = useState(300);
  const [totalKm, setTotalKm] = useState(80);

  useEffect(() => {
    if (!selectedId && rates.length > 0) setSelectedId(rates[0].id);
  }, [rates, selectedId]);

  const selected: TripRate | undefined = useMemo(
    () => rates.find((r) => r.id === selectedId) ?? rates[0],
    [rates, selectedId],
  );

  const canNonAc = selected ? nonAcAvailable(selected, mode) : false;

  // Force AC when Non-AC not available for the selected vehicle.
  useEffect(() => {
    if (!canNonAc && acMode === "nonac") setAcMode("ac");
  }, [canNonAc, acMode]);

  // Route distance query — only when both points chosen.
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
  const routeKm = oneWayKm != null ? (roundTrip ? oneWayKm * 2 : oneWayKm) : null;
  const durationLabel = formatDuration(route?.durationMinutes);

  const geometry: [number, number][] = useMemo(() => {
    if (route?.geometry && route.geometry.length > 0) {
      return route.geometry.map((p) => [p[0], p[1]] as [number, number]);
    }
    return [];
  }, [route?.geometry]);

  // Effective distance used in the math for KM mode.
  const effectiveKm = useMemo(() => {
    if (!manualMode && routeKm != null) return Math.round(routeKm * 10) / 10;
    return manualKm;
  }, [manualMode, routeKm, manualKm]);

  const distanceKm = effectiveKm;

  const estimate = useMemo(() => {
    if (!selected) return null;
    const ac = acMode === "ac";
    // Guard against partial Non-AC config: any missing Non-AC value falls back to
    // the AC rate so an estimate can never come out at ₹0.
    const ratePerKm = ac || selected.nonAcRatePerKm <= 0 ? selected.ratePerKm : selected.nonAcRatePerKm;
    const dayRate = ac || selected.nonAcDayRate <= 0 ? selected.dayRate : selected.nonAcDayRate;
    const extraKmRate = ac || selected.nonAcExtraKmRate <= 0 ? selected.extraKmRate : selected.nonAcExtraKmRate;

    const gstPercent = settings?.gstPercent ?? 0;
    const d = Math.max(1, days);
    const nights = Math.max(d - 1, 0);
    const bata = d * selected.driverBataPerDay;
    const nightHalt = nights * selected.nightHaltCharge;

    if (mode === "km") {
      const minBilled = d * selected.minKmPerDay;
      const billedKm = Math.max(distanceKm, minBilled);
      const minApplied = billedKm > distanceKm;
      const base = billedKm * ratePerKm;
      const subtotal = base + bata + nightHalt;
      const gst = (subtotal * gstPercent) / 100;
      return {
        rows: [
          { label: `Distance (${num.format(billedKm)} km × ${fmt(ratePerKm)}/km)`, value: base },
          { label: `Driver bata (${d} ${d > 1 ? "days" : "day"} × ${fmt(selected.driverBataPerDay)})`, value: bata },
          ...(nights > 0 ? [{ label: `Night halt (${nights} × ${fmt(selected.nightHaltCharge)})`, value: nightHalt }] : []),
        ],
        hint: minApplied
          ? `Minimum ${num.format(selected.minKmPerDay)} km/day applies — billed for ${num.format(billedKm)} km.`
          : null,
        gst, gstPercent, total: subtotal + gst,
      };
    }

    const base = d * dayRate;
    const includedKm = d * selected.kmIncludedPerDay;
    const extraKm = Math.max(totalKm - includedKm, 0);
    const extraCost = extraKm * extraKmRate;
    const subtotal = base + extraCost + bata + nightHalt;
    const gst = (subtotal * gstPercent) / 100;
    return {
      rows: [
        { label: `Day rental (${d} ${d > 1 ? "days" : "day"} × ${fmt(dayRate)})`, value: base },
        ...(extraKm > 0
          ? [{ label: `Extra km (${num.format(extraKm)} km × ${fmt(extraKmRate)})`, value: extraCost }]
          : [{ label: `Includes ${num.format(includedKm)} km`, value: 0 }]),
        { label: `Driver bata (${d} ${d > 1 ? "days" : "day"} × ${fmt(selected.driverBataPerDay)})`, value: bata },
        ...(nights > 0 ? [{ label: `Night halt (${nights} × ${fmt(selected.nightHaltCharge)})`, value: nightHalt }] : []),
      ],
      hint: extraKm === 0 ? `Package includes ${num.format(includedKm)} km over ${d} ${d > 1 ? "days" : "day"}.` : null,
      gst, gstPercent, total: subtotal + gst,
    };
  }, [selected, settings, mode, days, distanceKm, totalKm, acMode]);

  const routeLabel = useMemo(() => {
    if (from && to) {
      const kmStr = routeKm != null ? ` (${num.format(routeKm)} km${mode === "km" && roundTrip ? " round trip" : ""})` : "";
      return `${from.label} → ${to.label}${kmStr}`;
    }
    return null;
  }, [from, to, routeKm, mode, roundTrip]);

  const acLabel = acMode === "ac" ? "AC" : "Non-AC";

  const summaryText = useMemo(() => {
    if (!selected || !estimate) return "";
    const lines = [
      `Trip Estimate — ${data?.companyName ?? ""}`.trim(),
      routeLabel ? `Route: ${routeLabel}` : null,
      `Vehicle: ${selected.vehicleType}${selected.seats ? ` (${selected.seats} seater)` : ""} • ${acLabel}`,
      startDate ? `Dates: ${startDate}${returnDate && (roundTrip || mode === "day") ? ` → ${returnDate}` : ""}` : null,
      mode === "km"
        ? `Kilometre Rental (Outstation) • ${num.format(distanceKm)} km • ${days} day(s)`
        : `Day Rental (Local) • ${days} day(s) • ${num.format(totalKm)} km`,
      `Estimated total: ${fmt(estimate.total)}`,
    ].filter(Boolean) as string[];
    return lines.join("\n");
  }, [selected, estimate, data?.companyName, routeLabel, acLabel, mode, distanceKm, totalKm, days, startDate, returnDate, roundTrip]);

  const handleBook = () => {
    try {
      if (summaryText) sessionStorage.setItem("tripEstimate", summaryText);
    } catch {
      /* ignore */
    }
    navigate("/enquiry");
  };

  const whatsappUrl = buildWhatsAppUrl(phone, summaryText || "Hi, I'd like an estimate for a trip.");

  const unavailable = !isLoading && (settings?.enabled === false || rates.length === 0);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Hero */}
      <div className="relative py-16 md:py-24 px-4 text-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80&auto=format&fit=crop"
          alt="Trip Estimator"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.25)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-black/70" />
        <motion.div
          className="relative z-10 container mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4 bg-white/10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
            <Sparkles className="w-3.5 h-3.5" /> Instant Pricing
          </p>
          <h1 className="text-4xl md:text-6xl font-black mb-5 text-white drop-shadow-lg" style={{ fontFamily: "var(--app-font-serif)" }}>
            Trip Fare Estimator
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
            Pick your route and vehicle to get a transparent, itemised fare estimate in seconds.
          </p>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-10 md:py-16 max-w-6xl">
        {unavailable ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto text-center bg-white p-10 md:p-14 rounded-[2.5rem] shadow-xl border border-border/50"
          >
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
              <Calculator className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>
              Estimator Unavailable
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Our online fare estimator isn't available right now. Please contact us for a personalised quote — we'll be happy to help.
            </p>
            <Button size="lg" className="rounded-full gap-2 h-13 px-8 font-bold" onClick={() => navigate("/enquiry")}>
              <Send className="h-5 w-5" /> Contact Us for a Quote
            </Button>
          </motion.div>
        ) : isLoading || !selected || !estimate ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left — configurator */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1 — route */}
              <motion.section custom={0} variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-3xl border border-border/60 shadow-sm p-6 md:p-8">
                <StepHeader n={1} title="Where are you going?" />
                <div className="mt-5 grid sm:grid-cols-2 gap-4">
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
                </div>

                {/* Distance chip + round trip */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {routeLoading && bothChosen && (
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Calculating route…
                    </span>
                  )}
                  {oneWayKm != null && (
                    <>
                      <span className="inline-flex items-center gap-2 text-sm font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                        <Route className="h-4 w-4" />
                        {num.format(routeKm ?? oneWayKm)} km
                        {durationLabel ? ` · ${durationLabel}` : ""}
                      </span>
                      {!manualMode && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Info className="h-3.5 w-3.5" /> Distance auto-calculated
                        </span>
                      )}
                    </>
                  )}
                </div>

                {mode === "km" && oneWayKm != null && (
                  <div className="mt-4 flex items-center gap-3 bg-muted/50 rounded-2xl px-4 py-3">
                    <Repeat className="h-4 w-4 text-primary shrink-0" />
                    {allowOneWay && allowRoundTrip ? (
                      <>
                        <span className="text-sm font-bold">One way</span>
                        <Switch checked={roundTrip} onCheckedChange={setRoundTrip} />
                        <span className="text-sm font-bold">Round trip</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold">
                        {roundTrip ? "Round trip" : "One way"} only
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {roundTrip ? "Doubling one-way distance" : "One-way distance"}
                    </span>
                  </div>
                )}

                {/* Adjust / manual override */}
                {oneWayKm != null && (
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <div>
                      <label className="text-[12px] font-bold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                        <Gauge className="w-3.5 h-3.5" /> Adjust km
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={Math.round(effectiveKm)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v)) {
                            setManualMode(true);
                            setManualKm(Math.max(1, v));
                          }
                        }}
                        className="h-11 rounded-xl bg-white w-[130px]"
                      />
                    </div>
                    {manualMode && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-primary h-9"
                        onClick={() => setManualMode(false)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset to route distance
                      </Button>
                    )}
                  </div>
                )}

                {/* Map */}
                {bothChosen && (
                  <div className="mt-5 rounded-2xl overflow-hidden border border-border/60" style={{ height: 340 }}>
                    <RouteMap from={from!} to={to!} geometry={geometry} />
                  </div>
                )}
                {!bothChosen && (
                  <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Pick both places to auto-calculate distance on the map — or skip and enter km manually below.
                  </p>
                )}
              </motion.section>

              {/* Step 2 — trip type */}
              <motion.section custom={1} variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-3xl border border-border/60 shadow-sm p-6 md:p-8">
                <StepHeader n={2} title="Choose your trip type" />
                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                  <ModeCard
                    active={mode === "day"}
                    onClick={() => setMode("day")}
                    icon={<MapPin className="h-6 w-6" />}
                    title="Day Rental (Local)"
                    desc="Within-city sightseeing with included km per day."
                  />
                  <ModeCard
                    active={mode === "km"}
                    onClick={() => setMode("km")}
                    icon={<Route className="h-6 w-6" />}
                    title="Kilometre Rental (Outstation)"
                    desc="Long-distance trips billed per kilometre."
                  />
                </div>
              </motion.section>

              {/* Step 3 — vehicle */}
              <motion.section custom={2} variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-3xl border border-border/60 shadow-sm p-6 md:p-8">
                <StepHeader n={3} title="Select a vehicle" />
                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                  {rates.map((r) => {
                    const active = r.id === selected.id;
                    // Fall back to AC rate when this vehicle has no Non-AC rate for the mode
                    // (selecting it will force AC anyway) — never show ₹0.
                    const rpk = acMode === "ac" || r.nonAcRatePerKm <= 0 ? r.ratePerKm : r.nonAcRatePerKm;
                    const dr = acMode === "ac" || r.nonAcDayRate <= 0 ? r.dayRate : r.nonAcDayRate;
                    const highlight = mode === "km" ? `${fmt(rpk)}/km` : `${fmt(dr)}/day`;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        className={`text-left p-5 rounded-2xl border-2 transition-all ${
                          active
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border/60 hover:border-primary/40 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? "bg-primary text-white" : "bg-muted text-primary"}`}>
                              <Car className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-black text-[15px] leading-tight">{r.vehicleType}</p>
                              {r.vehicleExamples && (
                                <p className="text-xs text-muted-foreground mt-0.5">{r.vehicleExamples}</p>
                              )}
                            </div>
                          </div>
                          {r.seats ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">
                              <Users className="h-3 w-3" /> {r.seats}
                            </span>
                          ) : null}
                        </div>
                        <p className={`text-sm font-black ${active ? "text-primary" : "text-foreground"}`}>{highlight}</p>
                      </button>
                    );
                  })}
                </div>

                {/* AC / Non-AC toggle */}
                <div className="mt-6">
                  <label className="text-[13px] font-bold text-muted-foreground mb-3 block">Air conditioning</label>
                  <div className="inline-flex rounded-2xl border-2 border-border/60 p-1 bg-muted/40">
                    <button
                      type="button"
                      onClick={() => setAcMode("ac")}
                      className={cn(
                        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all",
                        acMode === "ac" ? "bg-primary text-white shadow" : "text-foreground hover:bg-white/60",
                      )}
                    >
                      <Snowflake className="h-4 w-4" /> AC
                    </button>
                    <button
                      type="button"
                      onClick={() => canNonAc && setAcMode("nonac")}
                      disabled={!canNonAc}
                      title={canNonAc ? undefined : "Not available for this vehicle"}
                      className={cn(
                        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all",
                        acMode === "nonac" ? "bg-primary text-white shadow" : "text-foreground hover:bg-white/60",
                        !canNonAc && "opacity-40 cursor-not-allowed hover:bg-transparent",
                      )}
                    >
                      <Fan className="h-4 w-4" /> Non-AC
                    </button>
                  </div>
                  {!canNonAc && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" /> Non-AC not available for this vehicle.
                    </p>
                  )}
                </div>
              </motion.section>

              {/* Step 4 — inputs */}
              <motion.section custom={3} variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-3xl border border-border/60 shadow-sm p-6 md:p-8">
                <StepHeader n={4} title="Trip details" />
                <div className="mt-6 space-y-7">
                  {mode === "km" && oneWayKm == null && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5">
                          <Gauge className="w-4 h-4" /> Distance (km)
                        </label>
                        <span className="text-sm font-black text-primary">{num.format(distanceKm)} km</span>
                      </div>
                      <Slider
                        value={[manualKm]}
                        min={50}
                        max={3000}
                        step={10}
                        onValueChange={(v) => { setManualMode(true); setManualKm(v[0] ?? 50); }}
                        className="mb-4"
                      />
                      <Input
                        type="number"
                        min={50}
                        max={3000}
                        value={manualKm}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v)) { setManualMode(true); setManualKm(Math.min(3000, Math.max(50, v))); }
                        }}
                        className="h-12 rounded-xl bg-white max-w-[180px]"
                      />
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5" /> Tip: pick From/To above to auto-calculate this.
                      </p>
                    </div>
                  )}

                  {mode === "day" && (
                    <div>
                      <label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5 mb-3">
                        <Gauge className="w-4 h-4" /> Expected total km
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={totalKm}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v)) setTotalKm(Math.max(0, v));
                        }}
                        className="h-12 rounded-xl bg-white max-w-[180px]"
                      />
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5 mb-3">
                        <CalendarDays className="w-4 h-4" /> Start date
                      </label>
                      <Input
                        type="date"
                        value={startDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (returnDate && e.target.value && returnDate < e.target.value) {
                            setReturnDate(e.target.value);
                          }
                        }}
                        className="h-12 rounded-xl bg-white"
                      />
                    </div>
                    {(roundTrip || mode === "day") && (
                      <div>
                        <label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5 mb-3">
                          <CalendarDays className="w-4 h-4" /> Return date
                        </label>
                        <Input
                          type="date"
                          value={returnDate}
                          min={startDate || new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="h-12 rounded-xl bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5 mb-3">
                      <CalendarDays className="w-4 h-4" /> Number of days
                    </label>
                    {dateDays != null ? (
                      <div className="inline-flex items-center gap-2 h-12 px-4 rounded-xl bg-primary/10 text-primary font-black">
                        {dateDays} {dateDays > 1 ? "days" : "day"}
                        <span className="text-xs font-bold text-primary/70">from your dates</span>
                      </div>
                    ) : (
                      <Stepper value={manualDays} min={1} max={60} onChange={setManualDays} />
                    )}
                  </div>
                </div>
              </motion.section>
            </div>

            {/* Right — estimate */}
            <div className="lg:col-span-1">
              <motion.div
                custom={4}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="lg:sticky lg:top-24 bg-white rounded-3xl border border-border/60 shadow-xl overflow-hidden"
              >
                <div className="bg-gradient-to-br from-primary to-orange-600 p-6 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/80 mb-1">Estimated Total</p>
                  <p className="text-4xl font-black tracking-tight">{fmt(estimate.total)}</p>
                  <p className="text-sm font-medium text-white/80 mt-1">
                    {selected.vehicleType} • {acLabel} • {mode === "km" ? "Outstation" : "Local"}
                  </p>
                  {from && to && (
                    <p className="text-sm font-bold text-white/95 mt-2 flex items-center gap-1.5">
                      <span className="truncate">{from.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{to.label}</span>
                    </p>
                  )}
                  {routeLabel && (
                    <p className="text-[11px] text-white/75 mt-0.5">{routeLabel}</p>
                  )}
                </div>

                <div className="p-6 space-y-3">
                  {estimate.rows.map((row, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-bold text-foreground whitespace-nowrap">{fmt(row.value)}</span>
                    </div>
                  ))}
                  {estimate.gstPercent > 0 && (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">GST ({estimate.gstPercent}%)</span>
                      <span className="font-bold text-foreground">{fmt(estimate.gst)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3 flex items-center justify-between">
                    <span className="font-black text-lg">Total</span>
                    <span className="font-black text-xl text-primary">{fmt(estimate.total)}</span>
                  </div>

                  {estimate.hint && (
                    <div className="flex items-start gap-2 text-xs text-primary bg-primary/5 rounded-xl p-3 border border-primary/10">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{estimate.hint}</span>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    {settings?.tollNote && <p className="text-[11px] text-muted-foreground leading-relaxed">{settings.tollNote}</p>}
                    {settings?.termsNote && <p className="text-[11px] text-muted-foreground leading-relaxed">{settings.termsNote}</p>}
                    <p className="text-[11px] text-muted-foreground italic">This is an estimate — the final fare may vary.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button size="lg" className="w-full rounded-full gap-2 h-13 font-bold shadow-lg shadow-primary/20" onClick={handleBook}>
                      <Send className="h-5 w-5" /> Book this trip
                    </Button>
                    {whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <Button size="lg" variant="outline" className="w-full rounded-full gap-2 h-13 font-bold border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700">
                          <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Map ---------- */

function pinIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:30px;height:40px;">
      <div style="position:absolute;top:0;left:0;width:30px;height:30px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>
      <div style="position:absolute;top:6px;left:0;width:30px;text-align:center;color:white;font-weight:800;font-size:12px;">${label}</div>
    </div>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) {
      map.fitBounds(L.latLngBounds(points.map((p) => L.latLng(p[0], p[1]))), { padding: [40, 40], maxZoom: 13 });
    }
  }, [points, map]);
  return null;
}

function RouteMap({ from, to, geometry }: { from: Place; to: Place; geometry: [number, number][] }) {
  const boundsPoints: [number, number][] = geometry.length
    ? geometry
    : [[from.lat, from.lng], [to.lat, to.lng]];
  return (
    <MapContainer
      center={[from.lat, from.lng]}
      zoom={7}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[from.lat, from.lng]} icon={pinIcon("#f97316", "A")} />
      <Marker position={[to.lat, to.lng]} icon={pinIcon("#0ea5e9", "B")} />
      {geometry.length > 1 && (
        <Polyline positions={geometry} pathOptions={{ color: "#f97316", weight: 4, opacity: 0.85 }} />
      )}
      <FitBounds points={boundsPoints} />
    </MapContainer>
  );
}

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shrink-0">
        {n}
      </div>
      <h2 className="text-lg md:text-xl font-black" style={{ fontFamily: "var(--app-font-serif)" }}>
        {title}
      </h2>
    </div>
  );
}

function ModeCard({
  active, onClick, icon, title, desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 rounded-2xl border-2 transition-all ${
        active ? "border-primary bg-primary/5 shadow-md" : "border-border/60 hover:border-primary/40 bg-white"
      }`}
    >
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-3 ${active ? "bg-primary text-white" : "bg-muted text-primary"}`}>
        {icon}
      </div>
      <p className="font-black text-[15px] mb-1">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </button>
  );
}

function Stepper({
  value, min, max, onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-11 w-11 rounded-xl border border-border bg-white flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="w-16 text-center">
        <span className="text-2xl font-black">{value}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-11 w-11 rounded-xl border border-border bg-white flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-40"
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
