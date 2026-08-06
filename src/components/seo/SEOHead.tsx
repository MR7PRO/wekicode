import { Helmet } from "react-helmet-async";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Block indexing for private / low-value pages */
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  keywords?: string[];
}

/**
 * Per-route SEO head. Sets title, description, canonical, robots and og:* tags
 * and optionally JSON-LD structured data blocks.
 */
export function SEOHead({
  title,
  description,
  path,
  image,
  type = "website",
  jsonLd,
  noindex = false,
  publishedTime,
  modifiedTime,
  authorName,
  keywords,
}: SEOHeadProps) {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const img = image || DEFAULT_OG_IMAGE;
  const trimmedTitle = title.length > 60 ? `${title.slice(0, 57)}…` : title;
  const trimmedDesc = description.length > 160 ? `${description.slice(0, 157)}…` : description;
  const ldArray = noindex ? [] : Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{trimmedTitle}</title>
      <meta name="description" content={trimmedDesc} />
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow"} />
      {!noindex && <link rel="canonical" href={url} />}
      {keywords && keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}
      <meta property="og:title" content={trimmedTitle} />
      <meta property="og:description" content={trimmedDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={img} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {authorName && <meta property="article:author" content={authorName} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={trimmedTitle} />
      <meta name="twitter:description" content={trimmedDesc} />
      <meta name="twitter:image" content={img} />
      {ldArray.map((data, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(data)}</script>
      ))}
    </Helmet>
  );
}
