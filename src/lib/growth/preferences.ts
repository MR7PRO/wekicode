export const PRIMARY_GOALS = [
  { value: "learn", label: "أتعلم البرمجة" },
  { value: "solve", label: "أحل مشاكل تقنية" },
  { value: "freelance", label: "أشتغل فريلانس" },
  { value: "portfolio", label: "أبني بورتفوليو" },
  { value: "ai", label: "أتابع الذكاء الاصطناعي" },
  { value: "jobs", label: "أبحث عن فرص عمل" },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
  { value: "professional", label: "محترف" },
] as const;

export const TRACKS = [
  "Frontend", "Backend", "Full Stack", "WordPress / CMS",
  "AI Tools", "Data Analysis", "Freelancing", "Career / Jobs", "Portfolio",
] as const;

/** Keywords used to match forums/tags/topics to a chosen track. No AI needed. */
export const TRACK_KEYWORDS: Record<string, string[]> = {
  "Frontend": ["react", "javascript", "js", "ui", "tailwind", "css", "html", "next", "واجهات", "فرونت"],
  "Backend": ["api", "backend", "database", "supabase", "node", "sql", "postgres", "خادم", "قواعد"],
  "Full Stack": ["fullstack", "full stack", "react", "api", "supabase", "node"],
  "WordPress / CMS": ["wordpress", "cms", "ووردبريس", "elementor", "woocommerce"],
  "AI Tools": ["ai", "ذكاء", "prompt", "automation", "llm", "gpt", "أتمتة"],
  "Data Analysis": ["data", "بيانات", "analysis", "python", "pandas", "sql", "تحليل"],
  "Freelancing": ["freelance", "فريلانس", "pricing", "تسعير", "clients", "عملاء", "contract", "عقود"],
  "Career / Jobs": ["job", "وظيفة", "career", "cv", "سيرة", "interview", "مقابلة", "فرص"],
  "Portfolio": ["portfolio", "بورتفوليو", "showcase", "مشروع", "معرض"],
};

/** Track keywords for the user's selected tracks (falls back to an empty list). */
export function keywordsForTracks(tracks: string[] | null | undefined): string[] {
  if (!tracks || tracks.length === 0) return [];
  return Array.from(new Set(tracks.flatMap((t) => TRACK_KEYWORDS[t] ?? [])));
}

/** Simple relevance score: how many track keywords appear in the given text. */
export function relevanceScore(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const lower = text.toLowerCase();
  return keywords.reduce((acc, k) => (lower.includes(k) ? acc + 1 : acc), 0);
}

export function goalLabel(value: string | null): string | null {
  return PRIMARY_GOALS.find((g) => g.value === value)?.label ?? null;
}

export function levelLabel(value: string | null): string | null {
  return EXPERIENCE_LEVELS.find((l) => l.value === value)?.label ?? null;
}