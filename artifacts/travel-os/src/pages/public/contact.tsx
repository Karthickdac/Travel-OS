import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Phone, MapPin, Mail, Clock, MessageSquare, ArrowRight, Car, Star, Users } from "lucide-react";
import { useGetPublicCmsSettings } from "@workspace/api-client-react";
import { getSiteDomain } from "@/lib/site-domain";

const SITE_DOMAIN = getSiteDomain();

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function PublicContact() {
  const { data: cms } = useGetPublicCmsSettings({ domain: SITE_DOMAIN });
  const phone = cms?.phone || "8110806339";
  const email = cms?.email || "admin@maduraismt.com";
  const address = cms?.address || "Madurai, Tamil Nadu";
  return (
    <div className="min-h-screen pt-14 md:pt-16 bg-background">
      {/* Header */}
      <div className="relative py-24 px-4 text-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920&q=80&auto=format&fit=crop"
          alt="Contact Hero"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.3)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80" />
        
        <motion.div 
          className="relative z-10 container mx-auto"
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-6">
            We're Here to Help
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 text-white drop-shadow-xl" style={{ fontFamily: 'var(--app-font-serif)' }}>
            Contact Us
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
            Reach out for bookings, customised quotations, or any travel queries. We pride ourselves on responding within minutes.
          </p>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Contact info */}
          <div className="space-y-12">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
              <h2 className="text-4xl font-black mb-4 text-foreground" style={{ fontFamily: 'var(--app-font-serif)' }}>Get in Touch</h2>
              <p className="text-lg text-muted-foreground mb-8 border-b border-border pb-8">Whether you're planning a quick weekend getaway or a grand South Indian tour, our team is ready to assist you 24/7.</p>
              
              <div className="space-y-8">
                {[
                  {
                    icon: Phone, title: "Call / WhatsApp", color: "bg-primary/10 text-primary",
                    content: <><a href={`tel:${phone}`} className="text-2xl font-black text-foreground hover:text-primary transition-colors block mb-1">{phone}</a><p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Available 7AM – 10PM, 7 days a week</p></>
                  },
                  {
                    icon: MapPin, title: "Our Office", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    content: <><p className="font-bold text-lg text-foreground mb-1">{address}</p><p className="text-sm text-muted-foreground leading-relaxed">Visit us or reach out — we're happy to help plan your journey.</p></>
                  },
                  {
                    icon: Mail, title: "Email Us", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
                    content: <><a href={`mailto:${email}`} className="font-bold text-lg text-foreground hover:text-primary transition-colors block mb-1">{email}</a><p className="text-sm font-medium text-muted-foreground">We reply to all emails within 2 hours</p></>
                  },
                ].map(({ icon: Icon, title, color, content }, i) => (
                  <motion.div key={title} custom={i + 1} variants={fadeUp} initial="hidden" animate="show" className="flex items-start gap-6 group">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110 ${color}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-bold text-[11px] text-primary uppercase tracking-[0.2em] mb-1.5">{title}</p>
                      {content}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right side: CTA cards */}
          <div className="space-y-6">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="bg-gradient-to-br from-primary to-orange-700 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10">
                <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-black mb-3" style={{ fontFamily: 'var(--app-font-serif)' }}>Book Over the Phone</h3>
                <p className="text-white/90 text-lg mb-8 leading-relaxed font-medium">Talk to our travel expert directly to discuss your requirements and get an instant quote for your trip.</p>
                <a href={`tel:${phone}`}>
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full font-black text-lg h-14 gap-3 w-full shadow-lg">
                    <Phone className="h-5 w-5" /> Call {phone}
                  </Button>
                </a>
              </div>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="bg-white border border-border/60 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/10 transition-colors duration-500" />
              <div className="relative z-10">
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-black mb-3 text-foreground" style={{ fontFamily: 'var(--app-font-serif)' }}>Online Enquiry</h3>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">Fill in your travel details and we'll prepare a comprehensive, personalised itinerary and quote.</p>
                <Link href="/enquiry">
                  <Button size="lg" variant="outline" className="rounded-full h-14 text-base gap-2 w-full font-bold border-border hover:bg-muted text-foreground">
                    Fill Enquiry Form <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div custom={2} variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-4 pt-4">
              {[
                { icon: Users, value: "5000+", label: "Travellers" },
                { icon: Star, value: "4.9/5", label: "Rating" },
                { icon: Car, value: "50+", label: "Vehicles" },
              ].map(({ icon: Icon, value, label }, index) => (
                <motion.div key={label} variants={fadeUp} className="bg-white border border-border/50 rounded-3xl p-5 text-center shadow-sm">
                  <div className="h-10 w-10 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xl font-black text-foreground mb-0.5">{value}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Full width Map placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-24 rounded-[3rem] overflow-hidden shadow-2xl border border-border/40 relative h-[400px] group"
        >
          {/* A blurred map background image would go here in a real app */}
          <div className="absolute inset-0 bg-muted/40" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')] opacity-30" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full border border-border/50 backdrop-blur-md bg-white/90 transform group-hover:-translate-y-2 transition-transform duration-500">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <MapPin className="h-8 w-8" />
              </div>
              <p className="font-black text-2xl mb-2 text-foreground" style={{ fontFamily: 'var(--app-font-serif)' }}>{address}</p>
              <p className="text-muted-foreground font-medium mb-6">Serving you with premium cabs and curated tours.</p>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer">
                <Button variant="default" className="rounded-full gap-2 w-full font-bold shadow-md">
                  <MapPin className="h-4 w-4" /> Open in Google Maps
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}