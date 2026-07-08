import { useListPublicBlogs } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, BookOpen, Clock, Tag } from "lucide-react";
import { getSiteDomain } from "@/lib/site-domain";
import { useLang } from "@/lib/lang-context";

const SITE_DOMAIN = getSiteDomain();

const BLOG_IMAGES = [
  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80&auto=format&fit=crop",
];

const fadeUp: Variants = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

function formatDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default function PublicBlog() {
  const { data: blogs, isLoading } = useListPublicBlogs({ domain: SITE_DOMAIN });
  const [, navigate] = useLocation();
  const { lang } = useLang();

  return (
    <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5]">
      {/* Hero */}
      <div className="relative py-24 px-4 text-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1920&q=80&auto=format&fit=crop"
          alt="Travel blog"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.35)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
        <motion.div className="relative z-10 container mx-auto" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-6">
            {lang === "en" ? "Travel Guides" : "பயண வழிகாட்டிகள்"}
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 text-white drop-shadow-xl" style={{ fontFamily: "var(--app-font-serif)" }}>
            {lang === "en" ? "Travel Blog" : "பயண வலைப்பதிவு"}
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg md:text-xl font-medium">
            {lang === "en"
              ? "Tips, guides and itineraries for temples, hills and beaches across South India."
              : "தென்னிந்தியாவின் கோயில்கள், மலைகள் மற்றும் கடற்கரைகளுக்கான குறிப்புகள், வழிகாட்டிகள் மற்றும் பயணத் திட்டங்கள்."}
          </p>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl overflow-hidden shadow-md bg-white border border-border/50">
                <Skeleton className="aspect-[16/10] w-full rounded-none" />
                <div className="p-6 space-y-3"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
              </div>
            ))}
          </div>
        ) : !blogs || blogs.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-border border-dashed shadow-sm">
            <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>
              {lang === "en" ? "No articles yet" : "இன்னும் கட்டுரைகள் இல்லை"}
            </h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {lang === "en" ? "Travel guides and tips will appear here soon." : "பயண வழிகாட்டிகள் விரைவில் இங்கே தோன்றும்."}
            </p>
          </div>
        ) : (
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" variants={stagger} initial="hidden" animate="show">
            {blogs.map((post, i) => (
              <motion.article
                key={post.id}
                variants={fadeUp}
                whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="group rounded-3xl overflow-hidden bg-white border border-border/50 flex flex-col cursor-pointer transition-all"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={post.featuredImage || BLOG_IMAGES[i % BLOG_IMAGES.length]}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).src = BLOG_IMAGES[i % BLOG_IMAGES.length]; }}
                  />
                  {post.category && (
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold text-primary">
                      <Tag className="h-3 w-3" /> {post.category}
                    </span>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground mb-3">
                    {post.publishedAt && <span>{formatDate(post.publishedAt, lang)}</span>}
                    {post.readTime ? (
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.readTime} min</span>
                    ) : null}
                  </div>
                  <h2 className="text-xl font-black mb-3 leading-snug group-hover:text-primary transition-colors" style={{ fontFamily: "var(--app-font-serif)" }}>
                    {post.title}
                  </h2>
                  <p className="text-[15px] text-muted-foreground line-clamp-3 mb-5 flex-1 leading-relaxed">{post.excerpt}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm font-bold text-muted-foreground">{post.author}</span>
                    <span className="text-sm font-bold text-primary flex items-center gap-1">
                      {lang === "en" ? "Read More" : "மேலும் படிக்க"} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
