import { useGetPublicBlog } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Phone, Tag, User } from "lucide-react";
import { getSiteDomain } from "@/lib/site-domain";
import { useSeo } from "@/lib/use-seo";
import { useLang } from "@/lib/lang-context";
import { useGetPublicCmsSettings } from "@workspace/api-client-react";

const SITE_DOMAIN = getSiteDomain();

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&q=80&auto=format&fit=crop";

function formatDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

// Renders the plain-text/markdown-lite article body: "## " headings,
// "- " bullet lists and blank-line-separated paragraphs. No raw HTML is
// injected, so tenant-authored content cannot carry scripts.
function ArticleBody({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="text-2xl md:text-3xl font-black mt-10 leading-snug" style={{ fontFamily: "var(--app-font-serif)" }}>
              {trimmed.slice(3).trim()}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="text-xl md:text-2xl font-bold mt-8 leading-snug" style={{ fontFamily: "var(--app-font-serif)" }}>
              {trimmed.slice(4).trim()}
            </h3>
          );
        }
        const lines = trimmed.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="list-disc pl-6 space-y-2 text-[17px] leading-relaxed text-foreground/90">
              {lines.map((l, j) => (
                <li key={j}>{l.trim().slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-[17px] leading-relaxed text-foreground/90">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function PublicBlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLang();
  const { data: post, isLoading, isError } = useGetPublicBlog(slug ?? "", { domain: SITE_DOMAIN });
  const { data: cms } = useGetPublicCmsSettings({ domain: SITE_DOMAIN });
  const phone = cms?.phone || "";

  const seoDescription = post ? (post.metaDescription || post.excerpt || undefined) : undefined;
  useSeo(
    post
      ? {
          title: post.metaTitle || post.title,
          description: seoDescription,
          image: post.featuredImage || undefined,
          jsonLdId: "seo-jsonld-page",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: seoDescription,
            image: post.featuredImage || undefined,
            author: { "@type": "Organization", name: post.author },
            datePublished: post.publishedAt || undefined,
          },
        }
      : { jsonLdId: "seo-jsonld-page", jsonLd: null },
  );

  if (isLoading) {
    return (
      <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5]">
        <Skeleton className="h-[40vh] w-full rounded-none" />
        <div className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
          <Skeleton className="h-10 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5] flex items-center justify-center px-4">
        <div className="text-center py-24 max-w-md">
          <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>
            {lang === "en" ? "Article not found" : "கட்டுரை கிடைக்கவில்லை"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {lang === "en" ? "This article may have been removed or is no longer available." : "இந்தக் கட்டுரை நீக்கப்பட்டிருக்கலாம்."}
          </p>
          <Link href="/blog">
            <Button className="rounded-full font-bold"><ArrowLeft className="h-4 w-4 mr-2" /> {lang === "en" ? "Back to Blog" : "வலைப்பதிவுக்கு திரும்பு"}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tags = (post.tags || "").split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5]">
      {/* Hero */}
      <div className="relative py-24 md:py-32 px-4 overflow-hidden">
        <img
          src={post.featuredImage || FALLBACK_IMAGE}
          alt={post.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.35)" }}
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/85" />
        <motion.div className="relative z-10 container mx-auto max-w-3xl text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {post.category && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-6">
              <Tag className="h-3 w-3" /> {post.category}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-black mb-6 text-white drop-shadow-xl leading-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-white/80">
            <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" /> {post.author}</span>
            {post.publishedAt && <span>{formatDate(post.publishedAt, lang)}</span>}
            {post.readTime ? (
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {post.readTime} {lang === "en" ? "min read" : "நிமிடம்"}</span>
            ) : null}
          </div>
        </motion.div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <Link href="/blog">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-primary mb-8 cursor-pointer hover:underline">
            <ArrowLeft className="h-4 w-4" /> {lang === "en" ? "All Articles" : "அனைத்து கட்டுரைகள்"}
          </span>
        </Link>

        {post.excerpt && (
          <p className="text-lg md:text-xl font-medium text-muted-foreground leading-relaxed mb-8 pb-8 border-b border-border">
            {post.excerpt}
          </p>
        )}

        <ArticleBody content={post.content} />

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-border">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-primary/10 text-primary px-4 py-1.5 text-xs font-bold">{t}</span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 rounded-3xl bg-primary text-white p-8 md:p-10 text-center shadow-xl shadow-primary/20">
          <h3 className="text-2xl md:text-3xl font-black mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>
            {lang === "en" ? "Planning this trip?" : "இந்தப் பயணத்தைத் திட்டமிடுகிறீர்களா?"}
          </h3>
          <p className="text-white/85 mb-6 max-w-xl mx-auto">
            {lang === "en"
              ? "Get a comfortable AC cab, an experienced driver and a custom itinerary at the best price."
              : "வசதியான AC கார், அனுபவமிக்க ஓட்டுநர் மற்றும் சிறந்த விலையில் பயணத் திட்டம் பெறுங்கள்."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/enquiry">
              <Button size="lg" variant="secondary" className="rounded-full font-bold">
                {lang === "en" ? "Send Enquiry" : "விசாரணை அனுப்பு"} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            {phone && (
              <a href={`tel:${phone}`}>
                <Button size="lg" variant="outline" className="rounded-full font-bold bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white">
                  <Phone className="h-4 w-4 mr-2" /> {phone}
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
