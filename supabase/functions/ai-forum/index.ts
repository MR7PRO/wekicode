import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://wekicode.lovable.app",
  "https://id-preview--a699ad31-eba0-4c1b-ae9b-fe12b2562e4e.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

const MODEL = "google/gemini-2.5-flash";
const MAX_INPUT = 8000;

// Daily per-action limits
const LIMITS: Record<string, number> = {
  suggest_topic: 10,
  detect_duplicates: 20,
  summarize_topic: 5,
  answer_draft: 10,
  convert_to_article: 3,
  moderation_analyze: 30,
};

type Action = keyof typeof LIMITS;

async function sha256(s: string) {
  const bytes = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function callAi(system: string, user: string): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`ai_gateway_${r.status}:${text.slice(0, 200)}`);
  }
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? "{}";
}

function safeJson(txt: string) {
  try { return JSON.parse(txt); } catch { /* try to extract */ }
  const m = txt.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* ignore */ } }
  return null;
}

function truncate(s: string, n = MAX_INPUT) {
  s = String(s || "");
  return s.length > n ? s.slice(0, n) + "\n…" : s;
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const H = cors(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers: H });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...H, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);
    const URL_ = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sbAuth = createClient(URL_, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await sbAuth.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);
    const sb = createClient(URL_, SVC);

    const body = await req.json().catch(() => null);
    if (!body || typeof body.action !== "string") return json({ error: "bad_request" }, 400);
    const action = body.action as Action;
    if (!(action in LIMITS)) return json({ error: "unknown_action" }, 400);

    // rate limit
    const { data: cnt } = await sb.rpc("ai_usage_count_today", { _user_id: user.id, _action: action });
    if ((cnt ?? 0) >= LIMITS[action]) {
      return json({ error: "daily_limit", message: `تجاوزت الحد اليومي (${LIMITS[action]}) لهذه الأداة. حاول غدًا.` }, 429);
    }

    let result: unknown = null;
    let targetType: string | null = null;
    let targetId: string | null = null;
    let inputHash: string | null = null;

    if (action === "suggest_topic") {
      const title = truncate(body.title, 300);
      const content = truncate(body.content, 4000);
      const type = String(body.type || "discussion");
      if (!title.trim() && !content.trim()) return json({ error: "empty" }, 400);
      const sys = `أنت مساعد WekiCode. حلّل مسودة سؤال/نقاش ومنتدى برمجي وأعد JSON فقط بهذا الشكل:
{"improvedTitle":"...","suggestedTags":["..."],"clarityScore":1-10,"missingDetails":["..."],"duplicateSearchQuery":"..."}
- اجعل العنوان المقترح واضحًا ومختصرًا بالعربية.
- اقترح 3-6 وسوم تقنية منخفضة الحالة (lowercase, بدون #).
- missingDetails: قائمة عربية قصيرة (ما يجب على المؤلف إضافته).
- لا تشرح، أعد JSON فقط.`;
      const usr = `النوع: ${type}\nالعنوان: ${title}\n\nالمحتوى:\n${content}`;
      const out = safeJson(await callAi(sys, usr)) || {};
      result = out;
    }

    else if (action === "detect_duplicates") {
      const title = truncate(body.title, 300);
      const content = truncate(body.content, 2000);
      const forumId = body.forum_id as string | undefined;
      if (!title.trim()) return json({ error: "empty" }, 400);
      // simple DB pre-search
      const words = title.trim().split(/\s+/).filter((w) => w.length > 2).slice(0, 5);
      const pattern = words.length ? words.map((w) => `title.ilike.%${w}%`).join(",") : `title.ilike.%${title.slice(0, 20)}%`;
      let q = sb.from("forum_topics").select("id, title, forum_id, forums(slug)").limit(15);
      if (forumId) q = q.eq("forum_id", forumId);
      const { data: candidates } = await q.or(pattern);
      const list = (candidates ?? []).map((c: any) => ({
        topic_id: c.id, title: c.title, url: `/forums/${c.forums?.slug}/${c.id}`,
      }));
      // ask AI to rank
      if (list.length === 0) {
        result = { possibleDuplicates: [], message: "لم نجد مواضيع مشابهة بوضوح." };
      } else {
        const sys = `أنت مساعد WekiCode. رتّب المواضيع التي قد تكون مكرّرة لسؤال المستخدم. أعد JSON فقط:
{"possibleDuplicates":[{"topic_id":"...","title":"...","reason":"...","similarityScore":0-100,"url":"..."}],"message":"..."}
اختر أعلى 3 فقط بالمعنى، وضع reason قصير عربي. أهمل غير المتصلة.`;
        const usr = `السؤال:\nالعنوان: ${title}\n${content}\n\nمرشحون:\n${JSON.stringify(list)}`;
        result = safeJson(await callAi(sys, usr)) || { possibleDuplicates: [], message: "" };
      }
    }

    else if (action === "summarize_topic") {
      const topicId = String(body.topic_id || "");
      if (!topicId) return json({ error: "bad_request" }, 400);
      const { data: t } = await sb.from("forum_topics").select("id, title, content, solved_reply_id, status").eq("id", topicId).maybeSingle();
      if (!t) return json({ error: "not_found" }, 404);
      const { data: replies } = await sb.from("forum_replies").select("id, content, is_solution, score").eq("topic_id", topicId).order("is_solution", { ascending: false }).order("score", { ascending: false }).limit(40);
      const materials = `${t.title}\n${t.content}\n---\n${(replies ?? []).map((r: any) => `[${r.is_solution ? "SOL" : "R"} ${r.score}]${r.content}`).join("\n---\n")}`;
      const truncated = truncate(materials, 12000);
      const hash = await sha256(truncated);
      targetType = "topic"; targetId = topicId; inputHash = hash;
      // cache
      const { data: cached } = await sb.from("forum_ai_summaries").select("*").eq("topic_id", topicId).eq("input_hash", hash).maybeSingle();
      if (cached) { result = { ...cached, cached: true }; }
      else {
        const sys = `أنت مساعد WekiCode. لخّص نقاشًا برمجيًا بالعربية باعتماد المحتوى المزوّد فقط. لا تخترع معلومات. أعد JSON فقط:
{"summary":"فقرة قصيرة","keyPoints":["..."],"solutionSummary":"إن وُجد حل مقبول, لخّصه","usefulReplies":["ملخصات قصيرة"]}`;
        const out = safeJson(await callAi(sys, `نقاش:\n${truncated}`)) || {};
        const rec = {
          topic_id: topicId,
          summary: String(out.summary || ""),
          key_points: Array.isArray(out.keyPoints) ? out.keyPoints.map(String).slice(0, 8) : [],
          solution_summary: out.solutionSummary ? String(out.solutionSummary) : null,
          model_name: MODEL,
          input_hash: hash,
          generated_by: user.id,
        };
        const { data: saved } = await sb.from("forum_ai_summaries").insert(rec).select().single();
        result = { ...saved, usefulReplies: out.usefulReplies ?? [], cached: false };
      }
    }

    else if (action === "answer_draft") {
      const topicId = String(body.topic_id || "");
      const intent = truncate(body.intent || "رد مختصر ومفيد", 200);
      const notes = truncate(body.notes || "", 1000);
      if (!topicId) return json({ error: "bad_request" }, 400);
      const { data: t } = await sb.from("forum_topics").select("title, content").eq("id", topicId).maybeSingle();
      if (!t) return json({ error: "not_found" }, 404);
      const sys = `أنت مساعد WekiCode. اكتب مسودة رد عربية عملية بحسب intent المستخدم اعتمادًا على السؤال فقط. إن نقصت التفاصيل قل ذلك. لا تدّعي حقائق غير موجودة. أعد JSON:
{"draftReply":"...","cautionNotes":["..."],"referencesToTopicContent":["اقتباس قصير"]}`;
      const usr = `intent: ${intent}\nملاحظات: ${notes}\n\nالسؤال:\n${t.title}\n${truncate(t.content, 4000)}`;
      result = safeJson(await callAi(sys, usr)) || {};
      targetType = "topic"; targetId = topicId;
    }

    else if (action === "convert_to_article") {
      const topicId = String(body.topic_id || "");
      if (!topicId) return json({ error: "bad_request" }, 400);
      const { data: t } = await sb.from("forum_topics").select("id, title, content, author_id, status").eq("id", topicId).maybeSingle();
      if (!t) return json({ error: "not_found" }, 404);
      const { data: isMod } = await sb.rpc("is_forum_mod", { _user_id: user.id });
      if (t.author_id !== user.id && !isMod) return json({ error: "forbidden" }, 403);
      const { data: existing } = await sb.from("knowledge_articles").select("id").eq("source_topic_id", topicId).maybeSingle();
      if (existing) return json({ article_id: existing.id, already: true });
      const { data: replies } = await sb.from("forum_replies").select("content, is_solution, score").eq("topic_id", topicId).order("is_solution", { ascending: false }).order("score", { ascending: false }).limit(20);
      const material = truncate(`${t.title}\n${t.content}\n---\n${(replies ?? []).map((r: any) => `[${r.is_solution ? "SOL" : "R"}] ${r.content}`).join("\n---\n")}`, 10000);
      const sys = `أنت محرّر WekiCode. حوّل نقاشًا محلولًا إلى مسودة مقال معرفي بالعربية بصيغة JSON:
{"title":"...","excerpt":"سطر تعريف","content":"مقال مركّب من: مقدمة، المشكلة، الحل، خطوات، مثال (إن وُجد كود), أخطاء شائعة، خلاصة — استخدم Markdown","tags":["..."]}
اعتمد على المحتوى المزوّد فقط. حافظ على نسب المصدر إلى النقاش الأصلي.`;
      const out = safeJson(await callAi(sys, material)) || {};
      const title = String(out.title || t.title).slice(0, 200);
      const slug = title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) + "-" + topicId.slice(0, 6);
      const rec = {
        source_topic_id: topicId,
        author_id: user.id,
        title,
        slug,
        excerpt: String(out.excerpt || "").slice(0, 400),
        content: String(out.content || ""),
        tags: Array.isArray(out.tags) ? out.tags.map(String).slice(0, 10) : [],
        status: "draft",
      };
      const { data: saved, error: e } = await sb.from("knowledge_articles").insert(rec).select().single();
      if (e) return json({ error: e.message }, 500);
      result = { article_id: saved.id, article: saved };
      targetType = "topic"; targetId = topicId;
    }

    else if (action === "moderation_analyze") {
      const { data: isMod } = await sb.rpc("is_forum_mod", { _user_id: user.id });
      if (!isMod) return json({ error: "forbidden" }, 403);
      const text = truncate(body.text, 4000);
      const sys = `أنت مساعد إشراف. حلّل محتوى مُبلَّغ عنه. أعد JSON:
{"risk":"low|medium|high","reason":"...","suggestedAction":"...","sensitiveWords":["..."]}
قرار الإشراف يبقى للبشر.`;
      result = safeJson(await callAi(sys, text)) || {};
    }

    // log usage (best-effort)
    await sb.from("ai_usage_logs").insert({
      user_id: user.id, action, target_type: targetType, target_id: targetId, input_hash: inputHash,
    });

    return json({ ok: true, action, result });
  } catch (e: any) {
    const msg = String(e?.message || "unknown");
    const status = msg.startsWith("ai_gateway_429") ? 429 : msg.startsWith("ai_gateway_402") ? 402 : 500;
    return json({ error: msg }, status);
  }
});