import { ChevronRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { type SectionCommon, fadeUp, scaleIn, staggerContainer, SectionHeading } from "./_shared";

const DEST_IMAGES = [
  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80&auto=format&fit=crop", // Madurai
  "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80&auto=format&fit=crop", // Rameshwaram
  "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&q=80&auto=format&fit=crop", // Kanyakumari
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80&auto=format&fit=crop", // Kovalam
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80&auto=format&fit=crop", // Trivandrum
  "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80&auto=format&fit=crop", // Dhanushkodi
  "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&q=80&auto=format&fit=crop", // Jatayu
];

function DestCard({
  name,
  tagline,
  img,
  index,
  aspect = "aspect-[4/5]",
  tokens
}: {
  name: string;
  tagline: string;
  img: string;
  index: number;
  aspect?: string;
  tokens: SectionCommon["tokens"];
}) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
      className={`group relative overflow-hidden ${tokens.cardRadius} ${aspect} shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-border/20`}
    >
      <img
        src={img}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${index}/600/800`; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end h-full">
        <motion.div 
          className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/90">South India</span>
          </div>
          <p className="text-white font-black text-2xl mb-2" style={{ fontFamily: tokens.headingFont || 'var(--app-font-serif)' }}>{name}</p>
          <p className="text-white/80 text-sm leading-relaxed">{tagline}</p>
        </motion.div>
      </div>
      
      <div className="absolute top-4 right-4 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
        <div className="bg-primary/90 backdrop-blur-md rounded-full p-2 shadow-lg">
          <ChevronRight className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DestinationsSection({ t, tokens, variant }: SectionCommon) {
  const cards = t.destCards;

  /* ── Compact: dense square tiles ── */
  if (variant === "compact") {
    return (
      <section className={`${tokens.sectionPadding} bg-muted/20 relative`}>
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow={t.destinations.eyebrow} heading={t.destinations.heading} sub={t.destinations.sub} tokens={tokens} />
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer(0.08)}
          >
            {cards.map((dest, i) => (
              <DestCard key={dest.name} name={dest.name} tagline={dest.tagline} img={DEST_IMAGES[i % DEST_IMAGES.length]} index={i} aspect="aspect-square" tokens={tokens} />
            ))}
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── Featured: one large hero tile + grid ── */
  if (variant === "featured") {
    const [first, ...rest] = cards;
    return (
      <section className={`${tokens.sectionPadding} bg-[#FAF8F5]`}>
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow={t.destinations.eyebrow} heading={t.destinations.heading} sub={t.destinations.sub} tokens={tokens} />
          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer(0.1)}
          >
            {first && (
              <div className="md:col-span-2 md:row-span-2">
                <DestCard name={first.name} tagline={first.tagline} img={DEST_IMAGES[0]} index={0} aspect="h-full min-h-[400px] md:min-h-[500px]" tokens={tokens} />
              </div>
            )}
            {rest.slice(0, 4).map((dest, i) => (
              <DestCard key={dest.name} name={dest.name} tagline={dest.tagline} img={DEST_IMAGES[(i + 1) % DEST_IMAGES.length]} index={i + 1} aspect="aspect-[4/3] md:aspect-auto md:h-[240px]" tokens={tokens} />
            ))}
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── Masonry (default): staggered grid ── */
  return (
    <section className={`${tokens.sectionPadding} bg-muted/10 relative overflow-hidden`}>
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-x-1/2" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[80px] translate-x-1/3" />
      
      <div className="container mx-auto px-4 relative z-10">
        <SectionHeading eyebrow={t.destinations.eyebrow} heading={t.destinations.heading} sub={t.destinations.sub} tokens={tokens} />
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer(0.1)}
        >
          {/* Create a visually interesting staggered masonry-like layout with specific spans/aspects */}
          {cards.slice(0, 6).map((dest, i) => {
            let aspect = "aspect-[4/5]"; // default portrait
            let colSpan = "";
            
            // Make some cards wider or taller for masonry feel
            if (i === 0) {
              aspect = "aspect-[16/10]"; // wide hero
              colSpan = "lg:col-span-2";
            } else if (i === 3) {
              aspect = "aspect-[16/10]"; // wide middle
              colSpan = "lg:col-span-2";
            } else if (i === 4) {
              aspect = "aspect-[4/5]"; // tall portrait
              colSpan = "lg:row-span-2";
            }

            return (
              <div key={dest.name} className={`${colSpan}`}>
                <DestCard 
                  name={dest.name} 
                  tagline={dest.tagline} 
                  img={DEST_IMAGES[i % DEST_IMAGES.length]} 
                  index={i} 
                  aspect={aspect} 
                  tokens={tokens} 
                />
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}