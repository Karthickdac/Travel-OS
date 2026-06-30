export type SectionKey = "hero" | "destinations" | "packages" | "whyUs";
export type TemplateKey = "classic" | "minimal" | "bold" | "luxe" | "vibrant";

export interface VariantOption {
  value: string;
  label: string;
}

export const SECTION_VARIANTS: Record<SectionKey, VariantOption[]> = {
  hero: [
    { value: "centered", label: "Centered" },
    { value: "split", label: "Split (text + image)" },
    { value: "minimal", label: "Minimal" },
  ],
  destinations: [
    { value: "masonry", label: "Masonry grid" },
    { value: "compact", label: "Compact tiles" },
    { value: "featured", label: "Featured + grid" },
  ],
  packages: [
    { value: "grid", label: "Grid" },
    { value: "carousel", label: "Carousel" },
    { value: "list", label: "List rows" },
  ],
  whyUs: [
    { value: "split", label: "Image split" },
    { value: "centered", label: "Centered" },
    { value: "cards", label: "Cards row" },
  ],
};

export const SECTION_META: { key: SectionKey; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "destinations", label: "Destinations" },
  { key: "packages", label: "Packages" },
  { key: "whyUs", label: "Why Choose Us" },
];

export interface TemplateTokens {
  /** Heading font override (CSS font-family). Empty = inherit theme font. */
  headingFont: string;
  /** Vertical padding utility for sections. */
  sectionPadding: string;
  /** Section heading typography. */
  headingClass: string;
  /** Eyebrow (small label above heading) typography. */
  eyebrowClass: string;
  /** Card corner radius utility. */
  cardRadius: string;
  /** Card border / surface treatment. */
  cardClass: string;
  /** Alternate (tinted) section background. */
  altSectionBg: string;
  /** Plain section background. */
  sectionBg: string;
  /** Hero overlay treatment over the background image. */
  heroOverlay: string;
  /** Hero brightness filter for the background image. */
  heroImageFilter: string;
  /** Hero heading typography. */
  heroHeadingClass: string;
  /** Whether section eyebrows are uppercase tracked labels. */
  uppercaseEyebrow: boolean;
}

export interface TemplateDef {
  key: TemplateKey;
  name: string;
  description: string;
  /** Swatch colours for the admin gallery thumbnail. */
  swatch: [string, string, string];
  /** Default per-section layout variant for this template. */
  defaults: Record<SectionKey, string>;
  tokens: TemplateTokens;
}

export const TEMPLATES: Record<TemplateKey, TemplateDef> = {
  classic: {
    key: "classic",
    name: "Classic",
    description: "Warm and image-rich — the signature TravelOS look.",
    swatch: ["#f97316", "#0d9488", "#1f2937"],
    defaults: { hero: "centered", destinations: "masonry", packages: "grid", whyUs: "split" },
    tokens: {
      headingFont: "",
      sectionPadding: "py-20",
      headingClass: "text-4xl font-black tracking-tight",
      eyebrowClass: "text-primary font-bold text-xs uppercase tracking-widest",
      cardRadius: "rounded-2xl",
      cardClass: "bg-card border border-border/40 shadow-md",
      altSectionBg: "bg-gray-50 dark:bg-muted/20",
      sectionBg: "bg-background",
      heroOverlay: "bg-gradient-to-b from-black/50 via-black/20 to-black/80",
      heroImageFilter: "brightness(0.32)",
      heroHeadingClass: "text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none",
      uppercaseEyebrow: true,
    },
  },
  minimal: {
    key: "minimal",
    name: "Modern Minimal",
    description: "Clean, airy and typographic with lots of whitespace.",
    swatch: ["#0f172a", "#64748b", "#e2e8f0"],
    defaults: { hero: "minimal", destinations: "compact", packages: "list", whyUs: "centered" },
    tokens: {
      headingFont: "",
      sectionPadding: "py-28",
      headingClass: "text-3xl md:text-4xl font-semibold tracking-tight",
      eyebrowClass: "text-muted-foreground font-medium text-xs uppercase tracking-[0.25em]",
      cardRadius: "rounded-xl",
      cardClass: "bg-card border border-border/60",
      altSectionBg: "bg-muted/30",
      sectionBg: "bg-background",
      heroOverlay: "bg-gradient-to-t from-black/60 via-black/10 to-transparent",
      heroImageFilter: "brightness(0.5)",
      heroHeadingClass: "text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-tight",
      uppercaseEyebrow: true,
    },
  },
  bold: {
    key: "bold",
    name: "Bold Adventure",
    description: "Dark, dramatic and oversized — built to grab attention.",
    swatch: ["#0a0a0a", "#f59e0b", "#ef4444"],
    defaults: { hero: "split", destinations: "featured", packages: "carousel", whyUs: "cards" },
    tokens: {
      headingFont: "",
      sectionPadding: "py-24",
      headingClass: "text-4xl md:text-5xl font-black uppercase tracking-tight",
      eyebrowClass: "text-amber-500 font-extrabold text-xs uppercase tracking-[0.3em]",
      cardRadius: "rounded-lg",
      cardClass: "bg-card border-2 border-border shadow-xl",
      altSectionBg: "bg-neutral-950 text-white",
      sectionBg: "bg-background",
      heroOverlay: "bg-gradient-to-r from-black/85 via-black/50 to-black/20",
      heroImageFilter: "brightness(0.45) contrast(1.1)",
      heroHeadingClass: "text-6xl sm:text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.9]",
      uppercaseEyebrow: true,
    },
  },
  luxe: {
    key: "luxe",
    name: "Elegant Luxe",
    description: "Refined serif headings with gold accents and generous spacing.",
    swatch: ["#fefce8", "#ca8a04", "#1c1917"],
    defaults: { hero: "centered", destinations: "featured", packages: "grid", whyUs: "split" },
    tokens: {
      headingFont: "'Playfair Display', Georgia, serif",
      sectionPadding: "py-28",
      headingClass: "text-4xl md:text-5xl font-bold tracking-tight",
      eyebrowClass: "text-amber-600 font-semibold text-xs uppercase tracking-[0.3em]",
      cardRadius: "rounded-none",
      cardClass: "bg-card border border-amber-600/20 shadow-sm",
      altSectionBg: "bg-amber-50/60 dark:bg-amber-950/10",
      sectionBg: "bg-background",
      heroOverlay: "bg-gradient-to-b from-black/40 via-black/25 to-black/70",
      heroImageFilter: "brightness(0.4) sepia(0.15)",
      heroHeadingClass: "text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-tight",
      uppercaseEyebrow: true,
    },
  },
  vibrant: {
    key: "vibrant",
    name: "Vibrant",
    description: "Colourful, playful and rounded with gradient accents.",
    swatch: ["#f43f5e", "#8b5cf6", "#22d3ee"],
    defaults: { hero: "split", destinations: "compact", packages: "carousel", whyUs: "cards" },
    tokens: {
      headingFont: "",
      sectionPadding: "py-20",
      headingClass: "text-4xl md:text-5xl font-extrabold tracking-tight",
      eyebrowClass: "text-primary font-bold text-xs uppercase tracking-widest",
      cardRadius: "rounded-3xl",
      cardClass: "bg-card border border-border/40 shadow-lg",
      altSectionBg: "bg-gradient-to-br from-primary/[0.06] via-background to-secondary/[0.06]",
      sectionBg: "bg-background",
      heroOverlay: "bg-gradient-to-tr from-primary/40 via-black/40 to-secondary/40",
      heroImageFilter: "brightness(0.4) saturate(1.2)",
      heroHeadingClass: "text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight leading-none",
      uppercaseEyebrow: true,
    },
  },
};

export const TEMPLATE_LIST: TemplateDef[] = Object.values(TEMPLATES);

export function getTemplate(key: string | undefined | null): TemplateDef {
  return (key && TEMPLATES[key as TemplateKey]) || TEMPLATES.classic;
}

/** Merge admin per-section overrides on top of the template defaults. */
export function resolveSectionLayouts(
  templateKey: string | undefined | null,
  sectionLayoutsJson: string | undefined | null,
): Record<SectionKey, string> {
  const template = getTemplate(templateKey);
  let overrides: Partial<Record<SectionKey, string>> = {};
  if (sectionLayoutsJson) {
    try {
      const parsed = JSON.parse(sectionLayoutsJson);
      if (parsed && typeof parsed === "object") overrides = parsed;
    } catch {
      overrides = {};
    }
  }
  return {
    hero: overrides.hero || template.defaults.hero,
    destinations: overrides.destinations || template.defaults.destinations,
    packages: overrides.packages || template.defaults.packages,
    whyUs: overrides.whyUs || template.defaults.whyUs,
  };
}
