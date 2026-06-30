import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Phone, MapPin, Mail, Send, CheckCircle2, Clock, Users, Car } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { POPULAR_DESTINATIONS, fetchCitySuggestions } from "@/lib/cities";

const TRIP_TYPES = ["Pilgrimage Tour", "Family Tour", "Honeymoon Package", "Adventure Tour", "Corporate Trip", "Airport Transfer", "Outstation Cab", "Local Cab", "Custom Package"];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" } }),
};

export default function PublicEnquiry() {
  const { toast } = useToast();
  const { t } = useLang();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", tripType: "", fromCity: "", toDestination: "",
    travelDate: "", returnDate: "", passengers: "2", vehiclePreference: "", budget: "", message: "",
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
      <div className="min-h-screen pt-16 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center"
        >
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black mb-2">Enquiry Submitted!</h2>
          <p className="text-muted-foreground mb-6">Thank you, <strong>{form.name}</strong>! Our team will call you at <strong>{form.phone}</strong> within 30 minutes.</p>
          <div className="bg-primary/5 rounded-2xl p-5 mb-6 text-left space-y-2">
            <p className="text-sm font-semibold mb-3">What happens next?</p>
            {["Our travel expert will call you", "We'll understand your requirements", "Custom itinerary and quote shared", "Confirm and book your dream trip"].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{s}
              </div>
            ))}
          </div>
          <a href="tel:8110806339">
            <Button size="lg" className="gap-2 rounded-full w-full"><Phone className="h-4 w-4" />Call us now: 8110806339</Button>
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-950 to-teal-900 py-14 px-4 text-white text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">Get a Free Quote</p>
          <h1 className="text-4xl font-black mb-3">Plan Your Trip</h1>
          <p className="text-white/70 max-w-md mx-auto">Fill in your details and our travel expert will call you back with a personalised quote.</p>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Left info */}
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
              <h2 className="text-xl font-bold mb-4">Why Enquire with Us?</h2>
              {[
                { icon: Clock, title: "Quick Response", desc: "Call back within 30 minutes" },
                { icon: Car, title: "Best Fleet", desc: "AC Innova, Crysta & Tempo" },
                { icon: Users, title: "Expert Guides", desc: "Experienced local guides" },
                { icon: CheckCircle2, title: "Best Prices", desc: "No hidden charges" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div><p className="font-semibold text-sm">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="bg-primary/5 rounded-2xl p-5">
              <p className="font-bold mb-3">Contact Directly</p>
              <div className="space-y-2">
                <a href="tel:8110806339" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"><Phone className="h-4 w-4 text-primary" />8110806339</a>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />Madurai, Tamil Nadu</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4 text-primary" />admin@maduraismt.com</div>
              </div>
            </motion.div>
          </div>

          {/* Enquiry form */}
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <form onSubmit={handleSubmit} className="bg-card border border-border/40 rounded-3xl p-8 shadow-lg space-y-5">
              <h3 className="text-lg font-bold">Enquiry Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.name} onChange={setF("name")} placeholder="Your name" required /></div>
                <div className="space-y-1.5"><Label>Phone Number *</Label><Input value={form.phone} onChange={setF("phone")} placeholder="+91 98765 43210" required /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={setF("email")} placeholder="you@example.com" /></div>
                <div className="space-y-1.5">
                  <Label>Trip Type</Label>
                  <select value={form.tripType} onChange={setF("tripType")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
                    <option value="">Select type</option>
                    {TRIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><Label>From City</Label><AutocompleteInput value={form.fromCity} onChange={(v) => setForm(f => ({ ...f, fromCity: v }))} suggestions={POPULAR_DESTINATIONS} fetchSuggestions={fetchCitySuggestions} placeholder="e.g. Madurai" /></div>
                <div className="space-y-1.5"><Label>To / Destination</Label><AutocompleteInput value={form.toDestination} onChange={(v) => setForm(f => ({ ...f, toDestination: v }))} suggestions={POPULAR_DESTINATIONS} fetchSuggestions={fetchCitySuggestions} placeholder="e.g. Rameshwaram" /></div>
                <div className="space-y-1.5"><Label>Travel Date</Label><Input type="date" value={form.travelDate} onChange={setF("travelDate")} /></div>
                <div className="space-y-1.5"><Label>Return Date</Label><Input type="date" value={form.returnDate} onChange={setF("returnDate")} /></div>
                <div className="space-y-1.5">
                  <Label>No. of Passengers</Label>
                  <Input type="number" value={form.passengers} onChange={setF("passengers")} min="1" max="50" />
                </div>
                <div className="space-y-1.5">
                  <Label>Vehicle Preference</Label>
                  <select value={form.vehiclePreference} onChange={setF("vehiclePreference")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
                    <option value="">Any vehicle</option>
                    <option>AC Innova</option>
                    <option>Crysta</option>
                    <option>Tempo Traveller</option>
                    <option>Mini Bus</option>
                    <option>Sedan</option>
                    <option>SUV</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Budget Range (₹)</Label>
                  <Input value={form.budget} onChange={setF("budget")} placeholder="e.g. ₹5,000 – ₹15,000 per person" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Additional Requirements</Label>
                  <textarea value={form.message} onChange={setF("message")} rows={3} placeholder="Any special requests, dietary requirements, hotel preferences…"
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button type="submit" size="lg" className="w-full rounded-full gap-2" disabled={loading}>
                  {loading ? <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</> : <><Send className="h-4 w-4" />Send Enquiry</>}
                </Button>
              </motion.div>
              <p className="text-xs text-muted-foreground text-center">We'll call you back within 30 minutes during business hours (7AM – 10PM)</p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
