import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { type SectionCommon, fadeUp, scaleIn, staggerContainer, SectionHeading } from "./_shared";

const DEST_IMAGES = [
  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1561361058-c24e1d9bd0ac?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1590080875861-dc27c08c1bc5?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1625905254553-4dc51ef00be2?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1626196340148-c7b0de7c0ffd?w=600&q=80&auto=format&fit=crop",
];

function DestCard({
  name,
  tagline,
  img,
  index,
  aspect = "aspect-[4/5]",
}: {
  name: string;
  tagline: string;
  img: string;
  index: number;
  aspect?: string;
}) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className={`group relative overflow-hidden rounded-2xl ${aspect} shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer`}
    >
      <img
        src={img}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${index}/400/500`; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white font-bold text-base leading-tight">{name}</p>
        <p className="text-white/70 text-xs mt-1 leading-snug">{tagline}</p>
      </div>
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
          <ChevronRight className="h-4 w-4 text-white" />
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
      <section className={`${tokens.sectionPadding} ${tokens.altSectionBg}`}>
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow={t.destinations.eyebrow} heading={t.destinations.heading} sub={t.destinations.sub} tokens={tokens} />
          <motion.div
            className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer(0.06)}
          >
            {cards.map((dest, i) => (
              <DestCard key={dest.name} name={dest.name} tagline={dest.tagline} img={DEST_IMAGES[i % DEST_IMAGES.length]} index={i} aspect="aspect-square" />
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
      <section className={`${tokens.sectionPadding} ${tokens.altSectionBg}`}>
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow={t.destinations.eyebrow} heading={t.destinations.heading} sub={t.destinations.sub} tokens={tokens} />
          <motion.div
            className="grid md:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer(0.08)}
          >
            {first && (
              <div className="md:col-span-2 md:row-span-2">
                <DestCard name={first.name} tagline={first.tagline} img={DEST_IMAGES[0]} index={0} aspect="h-full min-h-[20rem]" />
              </div>
            )}
            {rest.slice(0, 4).map((dest, i) => (
              <DestCard key={dest.name} name={dest.name} tagline={dest.tagline} img={DEST_IMAGES[(i + 1) % DEST_IMAGES.length]} index={i + 1} aspect="aspect-[4/3]" />
            ))}
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── Masonry (default): staggered 4-col grid ── */
  return (
    <section className={`${tokens.sectionPadding} ${tokens.altSectionBg}`}>
      <div className="container mx-auto px-4">
        <SectionHeading eyebrow={t.destinations.eyebrow} heading={t.destinations.heading} sub={t.destinations.sub} tokens={tokens} />
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer(0.08)}
        >
          {cards.map((dest, i) => (
            <DestCard key={dest.name} name={dest.name} tagline={dest.tagline} img={DEST_IMAGES[i % DEST_IMAGES.length]} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
