import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Calculator, MapPin, Route, CalendarDays, Users, Car, Info,
  Plus, Minus, Send, MessageCircle, Sparkles, Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useGetPublicTripRates, useGetPublicCmsSettings } from "@workspace/api-client-react";
import type { TripRate } from "@workspace/api-client-react";
import { getSiteDomain } from "@/lib/site-domain";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const SITE_DOMAIN = getSiteDomain();

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const fmt = (n: number) => inr.format(Math.round(n || 0));
const num = new Intl.NumberFormat("en-IN");

type Mode = "day" | "km";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

export default function PublicTripEstimator() {
  const [, navigate] = useLocation();
  const { data, isLoading } = useGetPublicTripRates({ domain: SITE_DOMAIN });
  const { data: cms } = useGetPublicCmsSettings({ domain: SITE_DOMAIN });
  const phone = cms?.phone || "";

  const settings = data?.settings;
  const rates = useMemo(() => data?.rates ?? [], [data?.rates]);

  const [mode, setMode] = useState<Mode>("km");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [days, setDays] = useState(1);
  const [distanceKm, setDistanceKm] = useState(300);
  const [totalKm, setTotalKm] = useState(80);

  useEffect(() => {
    if (!selectedId && rates.length > 0) setSelectedId(rates[0].id);
  }, [rates, selectedId]);

  const selected: TripRate | undefined = useMemo(
    () => rates.find((r) => r.id === selectedId) ?? rates[0],
    [rates, selectedId],
  );

  const estimate = useMemo(() => {
    if (!selected) return null;
    const gstPercent = settings?.gstPercent ?? 0;
    const d = Math.max(1, days);
    const nights = Math.max(d - 1, 0);
    const bata = d * selected.driverBataPerDay;
    const nightHalt = nights * selected.nightHaltCharge;

    if (mode === "km") {
      const minBilled = d * selected.minKmPerDay;
      const billedKm = Math.max(distanceKm, minBilled);
      const minApplied = billedKm > distanceKm;
      const base = billedKm * selected.ratePerKm;
      const subtotal = base + bata + nightHalt;
      const gst = (subtotal * gstPercent) / 100;
      return {
        rows: [
          { label: `Distance (${num.format(billedKm)} km × ${fmt(selected.ratePerKm)}/km)`, value: base },
          { label: `Driver bata (${d} ${d > 1 ? "days" : "day"} × ${fmt(selected.driverBataPerDay)})`, value: bata },
          ...(nights > 0 ? [{ label: `Night halt (${nights} × ${fmt(selected.nightHaltCharge)})`, value: nightHalt }] : []),
        ],
        hint: minApplied
          ? `Minimum ${num.format(selected.minKmPerDay)} km/day applies — billed for ${num.format(billedKm)} km.`
          : null,
        gst, gstPercent, total: subtotal + gst,
      };
    }

    const base = d * selected.dayRate;
    const includedKm = d * selected.kmIncludedPerDay;
    const extraKm = Math.max(totalKm - includedKm, 0);
    const extraCost = extraKm * selected.extraKmRate;
    const subtotal = base + extraCost + bata + nightHalt;
    const gst = (subtotal * gstPercent) / 100;
    return {
      rows: [
        { label: `Day rental (${d} ${d > 1 ? "days" : "day"} × ${fmt(selected.dayRate)})`, value: base },
        ...(extraKm > 0
          ? [{ label: `Extra km (${num.format(extraKm)} km × ${fmt(selected.extraKmRate)})`, value: extraCost }]
          : [{ label: `Includes ${num.format(includedKm)} km`, value: 0 }]),
        { label: `Driver bata (${d} ${d > 1 ? "days" : "day"} × ${fmt(selected.driverBataPerDay)})`, value: bata },
        ...(nights > 0 ? [{ label: `Night halt (${nights} × ${fmt(selected.nightHaltCharge)})`, value: nightHalt }] : []),
      ],
      hint: extraKm === 0 ? `Package includes ${num.format(includedKm)} km over ${d} ${d > 1 ? "days" : "day"}.` : null,
      gst, gstPercent, total: subtotal + gst,
    };
  }, [selected, settings, mode, days, distanceKm, totalKm]);

  const summaryText = useMemo(() => {
    if (!selected || !estimate) return "";
    const lines = [
      `Trip Estimate — ${data?.companyName ?? ""}`.trim(),
      `Vehicle: ${selected.vehicleType}${selected.seats ? ` (${selected.seats} seater)` : ""}`,
      mode === "km"
        ? `Kilometre Rental (Outstation) • ${num.format(distanceKm)} km • ${days} day(s)`
        : `Day Rental (Local) • ${days} day(s) • ${num.format(totalKm)} km`,
      `Estimated total: ${fmt(estimate.total)}`,
    ];
    return lines.join("\n");
  }, [selected, estimate, data?.companyName, mode, distanceKm, totalKm, days]);

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
            Pick your vehicle and trip type to get a transparent, itemised fare estimate in seconds.
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
              {/* Step 1 — trip type */}
              <motion.section custom={0} variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-3xl border border-border/60 shadow-sm p-6 md:p-8">
                <StepHeader n={1} title="Choose your trip type" />
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

              {/* Step 2 — vehicle */}
              <motion.section custom={1} variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-3xl border border-border/60 shadow-sm p-6 md:p-8">
                <StepHeader n={2} title="Select a vehicle" />
                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                  {rates.map((r) => {
                    const active = r.id === selected.id;
                    const highlight = mode === "km" ? `${fmt(r.ratePerKm)}/km` : `${fmt(r.dayRate)}/day`;
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
              </motion.section>

              {/* Step 3 — inputs */}
              <motion.section custom={2} variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-3xl border border-border/60 shadow-sm p-6 md:p-8">
                <StepHeader n={3} title="Trip details" />
                <div className="mt-6 space-y-7">
                  {mode === "km" && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5">
                          <Gauge className="w-4 h-4" /> Distance (km)
                        </label>
                        <span className="text-sm font-black text-primary">{num.format(distanceKm)} km</span>
                      </div>
                      <Slider
                        value={[distanceKm]}
                        min={50}
                        max={3000}
                        step={10}
                        onValueChange={(v) => setDistanceKm(v[0] ?? 50)}
                        className="mb-4"
                      />
                      <Input
                        type="number"
                        min={50}
                        max={3000}
                        value={distanceKm}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v)) setDistanceKm(Math.min(3000, Math.max(50, v)));
                        }}
                        className="h-12 rounded-xl bg-white max-w-[180px]"
                      />
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

                  <div>
                    <label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5 mb-3">
                      <CalendarDays className="w-4 h-4" /> Number of days
                    </label>
                    <Stepper value={days} min={1} max={60} onChange={setDays} />
                  </div>
                </div>
              </motion.section>
            </div>

            {/* Right — estimate */}
            <div className="lg:col-span-1">
              <motion.div
                custom={3}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="lg:sticky lg:top-24 bg-white rounded-3xl border border-border/60 shadow-xl overflow-hidden"
              >
                <div className="bg-gradient-to-br from-primary to-orange-600 p-6 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/80 mb-1">Estimated Total</p>
                  <p className="text-4xl font-black tracking-tight">{fmt(estimate.total)}</p>
                  <p className="text-sm font-medium text-white/80 mt-1">
                    {selected.vehicleType} • {mode === "km" ? "Outstation" : "Local"}
                  </p>
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
