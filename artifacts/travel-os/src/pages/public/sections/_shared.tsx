import { type Variants } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { translations } from "@/lib/lang-context";
import type { TemplateTokens } from "@/lib/homepage-templates";

export type TDict = (typeof translations)["en"];

export interface SectionCommon {
  t: TDict;
  tokens: TemplateTokens;
  variant: string;
  heroPhone: string;
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7 } },
};

export const staggerContainer = (stagger = 0.1, delayStart = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delayStart } },
});

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export function AnimatedNumber({ target }: { target: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const num = parseInt(target.replace(/\D/g, ""), 10);
    if (isNaN(num)) { setDisplay(target); return; }
    const suffix = target.replace(/[\d,]/g, "");
    let start = 0;
    const duration = 1400;
    const step = Math.ceil(num / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, num);
      setDisplay(start.toLocaleString() + suffix);
      if (start >= num) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <div ref={ref}>{display}</div>;
}

/** Section heading block shared by the content sections. */
export function SectionHeading({
  eyebrow,
  heading,
  sub,
  tokens,
  align = "center",
}: {
  eyebrow: string;
  heading: string;
  sub?: string;
  tokens: TemplateTokens;
  align?: "center" | "left";
}) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`mb-12 ${align === "center" ? "max-w-2xl mx-auto text-center" : ""}`}>
      <p className={`${tokens.eyebrowClass} mb-2 ${alignClass}`}>{eyebrow}</p>
      <h2
        className={`${tokens.headingClass} mb-3`}
        style={tokens.headingFont ? { fontFamily: tokens.headingFont } : undefined}
      >
        {heading}
      </h2>
      {sub && <p className="text-muted-foreground">{sub}</p>}
    </div>
  );
}
