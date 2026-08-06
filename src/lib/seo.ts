export const SITE_URL: string =
  (import.meta as any).env?.VITE_SITE_URL?.replace(/\/$/, "") || "https://wekicode.lovable.app";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/pwa-icon-new.png`;

export function absUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** BreadcrumbList JSON-LD from [{name, path}] */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

export function clamp(text: string | null | undefined, max = 155) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
