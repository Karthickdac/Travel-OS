import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Phone, MapPin, Mail, Send, CheckCircle2, Clock, Users, Car, Calendar, CreditCard } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { POPULAR_DESTINATIONS, fetchCitySuggestions } from "@/lib/cities";
import { useGetPublicCmsSettings } from "@workspace/api-client-react";
import { getSiteDomain } from "@/lib/site-domain";
import { useSearch } from "wouter";

const SITE_DOMAIN = getSiteDomain();

const TRIP_TYPES = ["Pilgrimage Tour", "Family Tour", "Honeymoon Package", "Adventure Tour", "Corporate Trip", "Airport Transfer", "Outstation Cab", "Local Cab", "Custom Package"];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const } }),
};

export default function PublicEnquiry() {
  const { toast } = useToast();
  const { t } = useLang();
  const { data: cms } = useGetPublicCmsSettings({ domain: SITE_DOMAIN });
  const contactPhone = cms?.phone || "8110806339";
  const contactEmail = cms?.email || "admin@maduraismt.com";
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const search = useSearch();
  const [form, setForm] = useState(() => {
    const params = new URLSearchParams(search);
    const destination = params.get("destination") ?? "";
    const pkg = params.get("package") ?? "";
    const tripTypeParam = params.get("tripType") ?? "";
    return {
      name: "", phone: "", email: "",
      tripType: TRIP_TYPES.includes(tripTypeParam) ? tripTypeParam : "",
      fromCity: "", toDestination: destination,
      travelDate: "", returnDate: "", passengers: "2", vehiclePreference: "", budget: "",
      message: pkg ? `I'm interested in the "${pkg}" package. Please share availability and pricing.` : "",
    };
  });

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setLoading(true);
    try {
      const paxNum = parseInt(form.passengers, 10);
      const res = await fetch("/api/v1/public/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(cms?.companyId ? { companyId: cms.companyId } : {}),
          name: form.name,
          phone: form.phone,
          ...(form.email ? { email: form.email } : {}),
          ...(form.toDestination ? { destination: form.toDestination } : {}),
          ...(form.travelDate ? { travelDate: form.travelDate } : {}),
          ...(Number.isFinite(paxNum) ? { pax: paxNum } : {}),
          message: [
            form.tripType && `Trip Type: ${form.tripType}`,
            form.fromCity && `From: ${form.fromCity}`,
            form.returnDate && `Return: ${form.returnDate}`,
            form.vehiclePreference && `Vehicle: ${form.vehiclePreference}`,
            form.budget && `Budget: ${form.budget}`,
            form.message,
          ].filter(Boolean).join(" | "),
        }),
      });
      if (res.ok) setSubmitted(true);
      else toast({ title: "Failed to submit. Please call us directly.", variant: "destructive" });
    } catch {
      toast({ title: "Network error. Please call us directly.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center px-4 bg-[#FAF8F5]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="max-w-lg w-full text-center bg-white p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-border/50"
        >
          <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-8 border-4 border-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-black mb-4 text-foreground" style={{ fontFamily: 'var(--app-font-serif)' }}>Enquiry Submitted Successfully!</h2>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">Thank you, <strong className="text-foreground">{form.name}</strong>! Our travel expert will review your requirements and call you at <strong className="text-foreground">{form.phone}</strong> shortly.</p>
          
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 mb-8 text-left">
            <p className="text-sm font-bold uppercase tracking-widest text-primary mb-4">What happens next?</p>
            <div className="space-y-4">
              {[
                "Our travel expert will call you to confirm details", 
                "We'll understand any specific requirements", 
                "A custom itinerary and quote will be shared", 
                "Confirm and book your dream trip securely"
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-[15px] font-medium text-foreground/80">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">{i+1}</div>
                  <span className="pt-0.5">{s}</span>
                </div>
              ))}
            </div>
          </div>
          
          <a href={`tel:${contactPhone}`}>
            <Button size="lg" className="gap-2 rounded-full w-full h-14 text-base font-bold shadow-lg hover:shadow-xl transition-shadow">
              <Phone className="h-5 w-5" /> Need it faster? Call us now
            </Button>
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5]">
      {/* Header */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=80&auto=format&fit=crop"
          alt="Contact Hero"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.25)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-black/60" />
        
        <motion.div 
          className="relative z-10 container mx-auto"
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
        >
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4 bg-white/10 inline-block px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/20">Get a Free Quote</p>
          <h1 className="text-5xl md:text-6xl font-black mb-6 text-white drop-shadow-lg" style={{ fontFamily: 'var(--app-font-serif)' }}>Plan Your Trip</h1>
          <p className="text-white/80 max-w-xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
            Fill in your details and our travel expert will prepare a personalised itinerary tailored to your needs.
          </p>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-10 md:py-16 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-16">
          {/* Left info */}
          <div className="space-y-8 order-2">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
              <h2 className="text-2xl font-black mb-8 border-b border-border pb-4" style={{ fontFamily: 'var(--app-font-serif)' }}>Why Enquire with Us?</h2>
              <div className="space-y-6">
                {[
                  { icon: Clock, title: "Quick Response", desc: "Our team will call you back within 30 minutes during business hours." },
                  { icon: Car, title: "Premium Fleet", desc: "Well-maintained AC Innova, Crysta, Tempo Traveller & Sedans." },
                  { icon: Users, title: "Expert Guidance", desc: "Experienced local drivers who know the best routes and stops." },
                  { icon: CheckCircle2, title: "Transparent Pricing", desc: "Best prices guaranteed with absolutely no hidden charges." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center shrink-0 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg mb-1">{title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="bg-gradient-to-br from-primary to-orange-600 rounded-[2rem] p-8 text-white shadow-xl">
              <p className="font-bold text-xl mb-6" style={{ fontFamily: 'var(--app-font-serif)' }}>Need immediate assistance?</p>
              <div className="space-y-5">
                <a href={`tel:${contactPhone}`} className="flex items-center gap-4 text-white hover:text-white/80 transition-colors group">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Call Us Now</p>
                    <p className="font-black text-xl tracking-wide">{contactPhone}</p>
                  </div>
                </a>
                <div className="flex items-center gap-4 text-white group">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Office</p>
                    <p className="font-semibold text-[15px]">{cms?.address || "Madurai, Tamil Nadu"}</p>
                  </div>
                </div>
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-4 text-white hover:text-white/80 transition-colors group">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Email</p>
                    <p className="font-semibold text-[15px]">{contactEmail}</p>
                  </div>
                </a>
              </div>
            </motion.div>
          </div>

          {/* Enquiry form */}
          <motion.div
            className="lg:col-span-2 order-1"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          >
            <form onSubmit={handleSubmit} className="bg-white border border-border/60 rounded-3xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-xl relative overflow-hidden">
              {/* Decorative top border */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-orange-400 to-primary" />
              
              <div className="mb-7 md:mb-8">
                <h3 className="text-2xl md:text-3xl font-black mb-2" style={{ fontFamily: 'var(--app-font-serif)' }}>Enquiry Details</h3>
                <p className="text-sm md:text-base text-muted-foreground font-medium">Share a few details and we'll tailor the perfect itinerary for you.</p>
              </div>

              <div className="space-y-5">
                {/* Personal Info section */}
                <fieldset className="bg-muted/30 p-5 md:p-6 rounded-2xl border border-border/50">
                  <legend className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 px-1"><Users className="w-4 h-4" /> Personal Information</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-muted-foreground">Full Name <span className="text-primary">*</span></Label>
                      <Input value={form.name} onChange={setF("name")} placeholder="Your name" required className="h-12 bg-white rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-muted-foreground">Phone Number <span className="text-primary">*</span></Label>
                      <Input value={form.phone} onChange={setF("phone")} placeholder="+91 98765 43210" required className="h-12 bg-white rounded-xl" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[13px] font-bold text-muted-foreground">Email Address</Label>
                      <Input type="email" value={form.email} onChange={setF("email")} placeholder="you@example.com" className="h-12 bg-white rounded-xl" />
                    </div>
                  </div>
                </fieldset>

                {/* Trip Details section */}
                <fieldset className="bg-muted/30 p-5 md:p-6 rounded-2xl border border-border/50">
                  <legend className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 px-1"><MapPin className="w-4 h-4" /> Trip Details</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[13px] font-bold text-muted-foreground">Trip Type</Label>
                      <select value={form.tripType} onChange={setF("tripType")} className="w-full h-12 border border-input rounded-xl px-4 text-[15px] font-medium bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                        <option value="">Select the type of trip</option>
                        {TRIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> From City</Label>
                      <div className="[&>div>input]:h-12 [&>div>input]:rounded-xl [&>div>input]:bg-white">
                        <AutocompleteInput value={form.fromCity} onChange={(v) => setForm(f => ({ ...f, fromCity: v }))} suggestions={POPULAR_DESTINATIONS} fetchSuggestions={fetchCitySuggestions} placeholder="e.g. Madurai" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> To / Destination</Label>
                      <div className="[&>div>input]:h-12 [&>div>input]:rounded-xl [&>div>input]:bg-white">
                        <AutocompleteInput value={form.toDestination} onChange={(v) => setForm(f => ({ ...f, toDestination: v }))} suggestions={POPULAR_DESTINATIONS} fetchSuggestions={fetchCitySuggestions} placeholder="e.g. Rameshwaram" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Travel Date</Label>
                      <Input type="date" value={form.travelDate} onChange={setF("travelDate")} className="h-12 rounded-xl bg-white" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Return Date</Label>
                      <Input type="date" value={form.returnDate} onChange={setF("returnDate")} className="h-12 rounded-xl bg-white" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> No. of Passengers</Label>
                      <Input type="number" value={form.passengers} onChange={setF("passengers")} min="1" max="50" className="h-12 rounded-xl bg-white" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Vehicle Preference</Label>
                      <select value={form.vehiclePreference} onChange={setF("vehiclePreference")} className="w-full h-12 border border-input rounded-xl px-4 text-[15px] font-medium bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                        <option value="">Any vehicle</option>
                        <option>AC Innova</option>
                        <option>Crysta</option>
                        <option>Tempo Traveller</option>
                        <option>Mini Bus</option>
                        <option>Sedan</option>
                        <option>SUV</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Budget Range (₹)</Label>
                      <Input value={form.budget} onChange={setF("budget")} placeholder="e.g. ₹5,000 – ₹15,000 per person" className="h-12 rounded-xl bg-white" />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-[13px] font-bold text-muted-foreground">Additional Requirements</Label>
                      <textarea 
                        value={form.message} 
                        onChange={setF("message")} 
                        rows={4} 
                        placeholder="Any special requests, dietary requirements, hotel preferences, specific temples to visit..."
                        className="w-full border border-input rounded-xl px-4 py-3 text-[15px] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                      />
                    </div>
                  </div>
                </fieldset>
              </div>

              <div className="mt-10 pt-8 border-t border-border">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button type="submit" size="lg" className="w-full rounded-full gap-3 h-14 text-lg font-black shadow-lg shadow-primary/20" disabled={loading}>
                    {loading ? (
                      <><div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting Enquiry…</>
                    ) : (
                      <><Send className="h-5 w-5" /> Send Enquiry Request</>
                    )}
                  </Button>
                </motion.div>
                <p className="text-sm font-medium text-muted-foreground text-center mt-6 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> We'll call you back within 30 minutes (7AM – 10PM)
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}