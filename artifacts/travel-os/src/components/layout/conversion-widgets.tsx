import { Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

function waNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function ConversionWidgets({
  phone,
  whatsapp,
  brandName,
}: {
  phone: string;
  whatsapp?: string | null;
  brandName: string;
}) {
  const wa = waNumber(whatsapp || phone);
  const waHref = `https://wa.me/${wa}?text=${encodeURIComponent(
    `Hi ${brandName}, I'd like to enquire about a trip.`,
  )}`;

  return (
    <>
      {/* Floating WhatsApp button — desktop & tablet */}
      <motion.a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
        className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2.5 h-14 pl-4 pr-6 rounded-full bg-[#25D366] text-white font-bold shadow-2xl shadow-black/25 hover:scale-105 transition-transform"
      >
        <span className="relative flex h-7 w-7 items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-white/40 animate-ping" />
          <MessageCircle className="h-7 w-7 relative" fill="white" strokeWidth={0} />
        </span>
        WhatsApp
      </motion.a>

      {/* Sticky bottom bar — mobile only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <a
          href={`tel:${phone}`}
          className="flex items-center justify-center gap-2 h-14 bg-primary text-white font-bold text-[15px]"
        >
          <Phone className="h-5 w-5" /> Call Now
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 h-14 bg-[#25D366] text-white font-bold text-[15px]"
        >
          <MessageCircle className="h-5 w-5" fill="white" strokeWidth={0} /> WhatsApp
        </a>
      </div>
      {/* Spacer so the sticky bar never covers page content on mobile */}
      <div className="md:hidden h-14" />
    </>
  );
}
