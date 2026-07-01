const OVERRIDE_KEY = "previewDomain";

/**
 * Resolves the tenant domain used for public CMS/package lookups.
 *
 * On real custom domains (e.g. www.maduraibesttravels.com) this returns the
 * live hostname. On the Replit preview host (which matches no tenant), a
 * `?previewDomain=<domain>` query param lets you preview any tenant; the value
 * is persisted in sessionStorage so it survives client-side navigation.
 * Pass an empty `?previewDomain=` to clear the override.
 */
export function getSiteDomain(): string {
  if (typeof window === "undefined") return "";

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has(OVERRIDE_KEY)) {
      const override = params.get(OVERRIDE_KEY)?.trim() ?? "";
      if (override) {
        sessionStorage.setItem(OVERRIDE_KEY, override);
        return override;
      }
      sessionStorage.removeItem(OVERRIDE_KEY);
      return window.location.hostname;
    }
    const stored = sessionStorage.getItem(OVERRIDE_KEY);
    if (stored) return stored;
  } catch {
    // sessionStorage/URL access can throw in restricted contexts — fall through.
  }

  return window.location.hostname;
}

/**
 * Converts a hex colour (#rrggbb / #rgb) to an "H S% L%" triplet suitable for
 * the `--primary` CSS custom property (which is wrapped in `hsl(...)`).
 * Returns null for invalid input so callers can fall back to the theme default.
 */
export function hexToHslTriplet(hex: string | undefined | null): string | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;

  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue /= 6;
  }

  return `${Math.round(hue * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
