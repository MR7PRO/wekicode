// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Pulls public forum, topic, tag and knowledge-article URLs from the backend.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = process.env.VITE_SITE_URL?.replace(/\/$/, "") || "https://wekicode.lovable.app";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Hard cap so publish output can never blow past hosting limits.
const MAX_URLS = 20000;

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/forums", changefreq: "daily", priority: "0.9" },
  { path: "/questions", changefreq: "daily", priority: "0.9" },
  { path: "/articles", changefreq: "daily", priority: "0.9" },
  { path: "/jobs", changefreq: "daily", priority: "0.8" },
  { path: "/courses", changefreq: "weekly", priority: "0.8" },
  { path: "/developers", changefreq: "weekly", priority: "0.7" },
  { path: "/leaderboard", changefreq: "daily", priority: "0.6" },
  { path: "/install", changefreq: "monthly", priority: "0.3" },
];

async function rest(table: string, query: string): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch {
    return [];
  }
}

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.slice(0, MAX_URLS).map((e) =>
    [
      `  <url>`,
      `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const entries: SitemapEntry[] = [...staticEntries];

  const forums = await rest("forums", "select=slug&is_active=eq.true&limit=2000");
  for (const f of forums) {
    if (f.slug) entries.push({ path: `/forums/${f.slug}`, changefreq: "daily", priority: "0.8" });
  }

  const topics = await rest(
    "forum_topics",
    "select=id,last_activity_at,forums(slug)&order=last_activity_at.desc&limit=10000",
  );
  for (const t of topics) {
    const slug = t.forums?.slug;
    if (!slug) continue;
    entries.push({
      path: `/forums/${slug}/${t.id}`,
      lastmod: t.last_activity_at ? String(t.last_activity_at).slice(0, 10) : undefined,
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  const tags = await rest("forum_tags", "select=slug,usage_count&order=usage_count.desc&limit=500");
  for (const tg of tags) {
    if (tg.slug && (tg.usage_count ?? 0) > 0) {
      entries.push({ path: `/tags/${tg.slug}`, changefreq: "weekly", priority: "0.5" });
    }
  }

  const articles = await rest(
    "knowledge_articles",
    "select=id,updated_at,created_at&status=eq.published&order=created_at.desc&limit=2000",
  );
  for (const a of articles) {
    const lm = a.updated_at || a.created_at;
    entries.push({
      path: `/knowledge/${a.id}`,
      lastmod: lm ? String(lm).slice(0, 10) : undefined,
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${Math.min(entries.length, MAX_URLS)} entries)`);
}

main();
