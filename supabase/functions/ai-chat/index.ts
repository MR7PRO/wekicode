import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - restrict to known domains
const allowedOrigins = [
  "https://epajjiiuaqjieecvmpln.lovable.app",
  "https://epajjiiuaqjieecvmpln.supabase.co",
  "https://a699ad31-eba0-4c1b-ae9b-fe12b2562e4e.lovableproject.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && allowedOrigins.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app') || origin.endsWith('.lovable.dev')
  );
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

// Input validation constants
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 10000;
const ALLOWED_ROLES = ["user", "assistant"];

// Rate limiting constants
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per hour
const RATE_LIMIT_WINDOW_MINUTES = 60; // 1 hour window

interface ChatMessage {
  role: string;
  content: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_at: string;
  retry_after?: number;
}

function validateMessages(messages: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "الرسائل يجب أن تكون في تنسيق مصفوفة" };
  }

  if (messages.length === 0) {
    return { valid: false, error: "يجب إرسال رسالة واحدة على الأقل" };
  }

  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `الحد الأقصى للرسائل هو ${MAX_MESSAGES}` };
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i] as ChatMessage;

    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `الرسالة ${i + 1} غير صالحة` };
    }

    if (!msg.role || typeof msg.role !== "string") {
      return { valid: false, error: `الرسالة ${i + 1} تفتقد دور المستخدم` };
    }

    if (!ALLOWED_ROLES.includes(msg.role)) {
      return { valid: false, error: `دور الرسالة ${i + 1} غير صالح` };
    }

    if (!msg.content || typeof msg.content !== "string") {
      return { valid: false, error: `الرسالة ${i + 1} تفتقد المحتوى` };
    }

    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `الرسالة ${i + 1} طويلة جداً (الحد الأقصى ${MAX_MESSAGE_LENGTH} حرف)` };
    }

    if (msg.content.trim().length === 0) {
      return { valid: false, error: `الرسالة ${i + 1} فارغة` };
    }
  }

  return { valid: true };
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "يجب تسجيل الدخول لاستخدام المساعد الذكي" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    // Create client for user authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Create service role client for rate limiting (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit
    const { data: rateLimitData, error: rateLimitError } = await supabaseAdmin.rpc(
      'check_ai_chat_rate_limit',
      {
        p_user_id: user.id,
        p_max_requests: RATE_LIMIT_MAX_REQUESTS,
        p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
      }
    );

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError.message);
      // Don't block on rate limit errors, just log and continue
    } else {
      const rateLimitResult = rateLimitData as RateLimitResult;
      
      if (!rateLimitResult.allowed) {
        console.log("Rate limit exceeded for user:", user.id);
        const retryAfter = rateLimitResult.retry_after || 60;
        const minutes = Math.ceil(retryAfter / 60);
        
        return new Response(
          JSON.stringify({ 
            error: `تم تجاوز حد الطلبات. يرجى الانتظار ${minutes} دقيقة قبل إرسال رسائل جديدة`,
            retryAfter: retryAfter
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter)
            } 
          }
        );
      }
      
      console.log("Rate limit check passed. Remaining requests:", rateLimitResult.remaining);
    }

    // Parse and validate request body
    let body: { messages?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "تنسيق الطلب غير صالح" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = body;

    // Validate messages input
    const validation = validateMessages(messages);
    if (!validation.valid) {
      console.error("Input validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `أنت مساعد برمجي ذكي متخصص في منصة WekiCode. مهمتك هي مساعدة المطورين العرب في:

1. **الإجابة على الأسئلة البرمجية**: شرح المفاهيم، تصحيح الأخطاء، واقتراح أفضل الممارسات
2. **مساعدة في الكود**: كتابة أكواد، مراجعتها، وتحسينها
3. **شرح التقنيات**: React, Node.js, TypeScript, Python, وغيرها
4. **نصائح المسار المهني**: توجيه المطورين في مسيرتهم

قواعد مهمة:
- أجب باللغة العربية دائماً
- كن موجزاً ومباشراً
- استخدم أمثلة عملية
- اقترح موارد إضافية عند الحاجة
- كن ودوداً ومشجعاً`;

    console.log("Sending request to AI gateway for user:", user.id);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(messages as ChatMessage[]),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار في استخدام المساعد الذكي" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "حدث خطأ في الاتصال بالمساعد الذكي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير معروف" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
