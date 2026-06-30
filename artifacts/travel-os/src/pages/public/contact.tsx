import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Phone, MapPin, Mail, Clock, MessageSquare, ArrowRight, Car, Star, Users } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function PublicContact() {
  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-950 to-teal-900 py-16 px-4 text-white text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">We're Here to Help</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Contact Us</h1>
          <p className="text-white/70 max-w-md mx-auto">Reach out for bookings, quotations, or any travel query. We respond within minutes.</p>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Contact info */}
          <div className="space-y-6">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
              <h2 className="text-2xl font-black mb-6">Get in Touch</h2>
            </motion.div>

            {[
              {
                icon: Phone, title: "Call / WhatsApp", color: "bg-primary/10 text-primary",
                content: <><a href="tel:8110806339" className="text-xl font-black text-primary hover:underline">8110806339</a><p className="text-sm text-muted-foreground mt-1">Available 7AM – 10PM, 7 days a week</p></>
              },
              {
                icon: MapPin, title: "Our Office", color: "bg-teal-100 text-teal-700",
                content: <><p className="font-semibold">Madurai, Tamil Nadu</p><p className="text-sm text-muted-foreground">Near Meenakshi Amman Temple area</p><p className="text-sm text-muted-foreground">Tamil Nadu – 625 001</p></>
              },
              {
                icon: Mail, title: "Email Us", color: "bg-blue-100 text-blue-700",
                content: <><a href="mailto:admin@maduraismt.com" className="font-semibold hover:text-primary transition-colors">admin@maduraismt.com</a><p className="text-sm text-muted-foreground mt-1">We reply within 2 hours</p></>
              },
              {
                icon: Clock, title: "Business Hours", color: "bg-amber-100 text-amber-700",
                content: <><p className="font-semibold">Mon – Sun: 7:00 AM – 10:00 PM</p><p className="text-sm text-muted-foreground">Emergency bookings available 24/7</p></>
              },
            ].map(({ icon: Icon, title, color, content }, i) => (
              <motion.div key={title} custom={i + 1} variants={fadeUp} initial="hidden" animate="show" className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
                  {content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right side: CTA cards */}
          <div className="space-y-5">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="bg-gradient-to-br from-primary to-orange-600 rounded-3xl p-8 text-white shadow-xl shadow-primary/20">
              <Phone className="h-8 w-8 mb-4 opacity-80" />
              <h3 className="text-xl font-black mb-2">Book Over the Phone</h3>
              <p className="text-white/80 text-sm mb-5">Talk to our travel expert directly and get an instant quote for your trip.</p>
              <a href="tel:8110806339">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full font-bold gap-2 w-full">
                  <Phone className="h-4 w-4" /> Call 8110806339
                </Button>
              </a>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="bg-card border border-border/40 rounded-3xl p-8 shadow-lg">
              <MessageSquare className="h-8 w-8 mb-4 text-teal-600" />
              <h3 className="text-xl font-black mb-2">Online Enquiry</h3>
              <p className="text-muted-foreground text-sm mb-5">Fill in your travel details and we'll prepare a personalised itinerary and quote.</p>
              <Link href="/enquiry">
                <Button size="lg" variant="outline" className="rounded-full gap-2 w-full font-bold">
                  Enquire Online <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="grid grid-cols-3 gap-4">
              {[
                { icon: Users, value: "5000+", label: "Happy Travellers" },
                { icon: Star, value: "4.9★", label: "Rating" },
                { icon: Car, value: "50+", label: "Vehicles" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="bg-card border border-border/40 rounded-2xl p-4 text-center">
                  <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-lg font-black text-primary">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Map placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 rounded-3xl overflow-hidden shadow-lg border border-border/40 bg-muted/30 h-64 flex items-center justify-center"
        >
          <div className="text-center">
            <MapPin className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="font-bold text-lg">Madurai, Tamil Nadu</p>
            <p className="text-muted-foreground text-sm mt-1">Serving Tamil Nadu & Kerala with premium travel services</p>
            <a href="https://maps.google.com/?q=Madurai+Tamil+Nadu" target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="mt-4 rounded-full gap-1.5 text-xs">
                <MapPin className="h-3 w-3" /> Open in Maps
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
