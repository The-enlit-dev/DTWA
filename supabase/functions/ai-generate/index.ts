import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number,
  fallbackModel?: string
): Promise<{ content: string; model: string; tokens: number }> {
  const doFetch = async (mdl: string) => {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://decodingtomorrowwithattharva.netlify.app",
        "X-Title": "Decoding Tomorrow",
      },
      body: JSON.stringify({
        model: mdl,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });
    return res;
  };

  let res = await doFetch(model);

  if (!res.ok && fallbackModel && fallbackModel !== model) {
    res = await doFetch(fallbackModel);
    model = fallbackModel;
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const tokens = data.usage?.total_tokens || 0;
  return { content, model, tokens };
}

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string; model: string; tokens: number }> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const tokens = data.usageMetadata?.totalTokenCount || 0;
  return { content, model, tokens };
}

async function hashPrompt(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const FEATURE_PROMPTS: Record<string, (input: any) => string> = {
  tool_analysis: (i) => `Analyze the AI tool "${i.tool_name || ""}"${i.website ? ` (website: ${i.website})` : ""}.
Category: ${i.category || "Unknown"}
Focus areas: ${i.focus || "General overview"}

Provide a comprehensive analysis in JSON format with these fields:
{
  "description": "What the tool does",
  "features": ["feature1", "feature2", ...],
  "target_audience": "Who it's for",
  "pricing": "Pricing details",
  "free_plan": "What's available for free",
  "strengths": ["strength1", ...],
  "weaknesses": ["weakness1", ...],
  "alternatives": ["alternative1", ...],
  "use_cases": ["use case1", ...],
  "seo_title": "SEO-optimized title (60 chars max)",
  "meta_description": "Meta description (160 chars max)",
  "tags": ["tag1", "tag2", ...]
}

Only include factual information. If something is unknown, write "Requires manual verification".`,

  comparison: (i) => `Create a detailed comparison between "${i.tool_a || ""}" and "${i.tool_b || ""}".
Comparison criteria: ${i.criteria || "Features, pricing, ease of use, target audience"}

Provide the comparison in JSON format:
{
  "overview": "Brief overview of both tools",
  "features": { "tool_a": ["..."], "tool_b": ["..."] },
  "pricing": { "tool_a": "...", "tool_b": "..." },
  "free_plan": { "tool_a": "...", "tool_b": "..." },
  "pros": { "tool_a": ["..."], "tool_b": ["..."] },
  "cons": { "tool_a": ["..."], "tool_b": ["..."] },
  "best_for": { "tool_a": "...", "tool_b": "..." },
  "use_cases": ["shared use case", ...],
  "differences": ["key difference 1", ...],
  "recommendation": "Which tool to choose when",
  "seo_title": "SEO title (60 chars max)",
  "meta_description": "Meta description (160 chars max)"
}`,

  case_study: (i) => `Create a case study for ${i.company || ""} using ${i.tool_used || ""}.
Use case: ${i.use_case || ""}
Known results: ${i.results || ""}

Provide in JSON format:
{
  "problem": "The challenge faced",
  "solution": "How the AI tool solved it",
  "ai_usage": "How AI was specifically used",
  "results": "Quantifiable results",
  "benefits": ["benefit1", ...],
  "limitations": ["limitation1", ...],
  "lessons": ["lesson1", ...]
}`,

  blog_simplifier: (i) => `Simplify this technical AI article for different audiences.

Source: ${i.source_url || "Direct text"}
Article text: ${i.source_text || ""}
Target audience: ${i.target_audience || "General"}

Provide in JSON format:
{
  "beginner": "Very simple explanation with no jargon",
  "student": "Student-friendly explanation with examples",
  "business": "Practical business-focused explanation",
  "quick_read": "Short summary with key bullet points"
}

Preserve factual accuracy. Do not invent information.`,

  video_script: (i) => `Create a video script about: ${i.topic || ""}
Duration: ${i.duration || "2-5 minutes"}
Platform: ${i.platform || "YouTube"}
Tone: ${i.tone || "Informative"}

Provide in JSON format:
{
  "hook": "First 5 seconds to grab attention",
  "narration_script": "Full narration script",
  "scenes": [{"visual": "What to show", "narration": "What to say", "on_screen_text": "Text overlay"}],
  "cta": "Call to action",
  "short_version": "30-60 second version",
  "long_version": "2-5 minute version"
}`,

  newsletter: (i) => `Generate a newsletter for Decoding Tomorrow.
Subject: ${i.subject || ""}
Topics: ${i.topics || ""}
Audience: ${i.audience || "AI enthusiasts"}

Provide in JSON format:
{
  "subject": "Newsletter subject line",
  "introduction": "Opening paragraph",
  "ai_news": "Key AI news items",
  "featured_article": "Featured article recommendation",
  "featured_tool": "Featured AI tool",
  "glossary_term": "Glossary term to feature",
  "cta": "Call to action"
}`,

  social_post: (i) => `Create a social media post for ${i.platform || "Twitter/X"}.
Content: ${i.content_title || ""}
URL: ${i.content_url || ""}
Description: ${i.content_description || ""}

Provide in JSON format:
{
  "caption": "Engaging social media caption with hashtags",
  "hashtags": ["#ai", "#tech", ...],
  "best_posting_time": "Recommended posting time"
}`,

  simplify: (i) => `Simplify and improve this text for clarity and readability:\n\n${i.text || ""}\n\nReturn the simplified version only.`,

  improve: (i) => `Improve this text for clarity, flow, and engagement. Keep the meaning the same:\n\n${i.text || ""}\n\nReturn the improved version only.`,

  generate_seo: (i) => `Generate SEO metadata for this article:\nTitle: ${i.title || ""}\nContent excerpt: ${(i.content || "").slice(0, 500)}\n\nReturn JSON: {"seo_title": "60 chars max", "meta_description": "160 chars max", "primary_keyword": "", "secondary_keywords": ["keyword1", "keyword2"]}`,

  generate_title: (i) => `Generate 5 compelling, SEO-friendly title options for this article:\n${i.content || i.title || ""}\n\nReturn JSON: {"titles": ["title1", "title2", "title3", "title4", "title5"]}`,

  generate_meta_description: (i) => `Generate a meta description (160 chars max) for this article:\nTitle: ${i.title || ""}\nContent: ${(i.content || "").slice(0, 800)}\n\nReturn JSON: {"meta_description": "..."}`,

  create_summary: (i) => `Create a concise summary of this article in 3-4 sentences:\n${i.content || ""}\n\nReturn the summary only.`,

  glossary_simplify: (i) => `Create a simple, easy-to-understand explanation of the term "${i.term || ""}" for a general audience.\n\nTechnical definition: ${i.definition || ""}\n\nReturn JSON: {"simple_explanation": "...", "examples": ["example1", "example2"]}`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json();
    const feature: string = body.feature;
    const input: any = body.input || {};
    const skipCache: boolean = body.skip_cache || false;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin/editor role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, username")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !["admin", "super_admin", "editor"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden — admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load AI settings
    const { data: settings } = await supabaseAdmin
      .from("ai_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const aiEnabled = settings?.ai_enabled ?? true;
    if (!aiEnabled) {
      return new Response(JSON.stringify({ error: "AI generation is currently disabled. Enable it in AI Settings." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const provider = settings?.provider || "openrouter";
    const model = settings?.model || "openrouter/free";
    const fallbackModel = settings?.fallback_model || "";
    const temperature = settings?.temperature ?? 0.7;
    const maxTokens = settings?.max_tokens ?? 2048;
    const dailyLimit = settings?.daily_request_limit ?? 50;
    const systemPrompt = settings?.system_prompt || "You are a helpful AI assistant.";

    // Check daily request limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabaseAdmin
      .from("ai_usage_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString())
      .in("status", ["success", "failed"]);

    if ((todayCount || 0) >= dailyLimit) {
      // Log the blocked request
      await supabaseAdmin.from("ai_usage_log").insert({
        feature,
        prompt_hash: "rate_limited",
        model,
        provider,
        status: "rate_limited",
        error_message: `Daily limit of ${dailyLimit} reached`,
        requested_by: user.id,
      });

      return new Response(JSON.stringify({
        error: `Daily AI request limit reached (${dailyLimit}). Try again tomorrow or increase the limit in AI Settings.`,
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build prompt
    const promptBuilder = FEATURE_PROMPTS[feature];
    if (!promptBuilder) {
      return new Response(JSON.stringify({ error: `Unknown feature: ${feature}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userPrompt = promptBuilder(input);
    const promptHashInput = `${feature}|${JSON.stringify(input)}|${model}`;
    const promptHash = await hashPrompt(promptHashInput);

    // Check cache
    if (!skipCache) {
      const { data: cached } = await supabaseAdmin
        .from("ai_cache")
        .select("*")
        .eq("prompt_hash", promptHash)
        .maybeSingle();

      if (cached) {
        // Log cache hit
        await supabaseAdmin.from("ai_usage_log").insert({
          feature,
          prompt_hash: promptHash,
          model,
          provider,
          status: "cached",
          tokens_used: 0,
          requested_by: user.id,
        });

        return new Response(JSON.stringify({
          content: cached.output_data,
          cached: true,
          model,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Call AI provider
    let result: { content: string; model: string; tokens: number };
    try {
      if (provider === "openrouter") {
        const apiKey = Deno.env.get("OPENROUTER_API_KEY");
        if (!apiKey) {
          throw new Error("OPENROUTER_API_KEY not configured in edge function secrets.");
        }
        result = await callOpenRouter(apiKey, model, systemPrompt, userPrompt, temperature, maxTokens, fallbackModel);
      } else if (provider === "gemini") {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY not configured in edge function secrets.");
        }
        const geminiModel = model.replace("gemini/", "");
        result = await callGemini(apiKey, geminiModel, systemPrompt, userPrompt, temperature, maxTokens);
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (aiErr: any) {
      // Log failed request
      await supabaseAdmin.from("ai_usage_log").insert({
        feature,
        prompt_hash: promptHash,
        model,
        provider,
        status: "failed",
        error_message: aiErr.message,
        requested_by: user.id,
      });

      return new Response(JSON.stringify({ error: aiErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse content as JSON if possible
    let outputData: any = result.content;
    try {
      outputData = JSON.parse(result.content);
    } catch {
      // Keep as string
    }

    // Save to cache
    await supabaseAdmin.from("ai_cache").insert({
      prompt_hash: promptHash,
      feature,
      input_data: input,
      output_data: outputData,
      model: result.model,
      provider,
      created_by: user.id,
    });

    // Log successful request
    await supabaseAdmin.from("ai_usage_log").insert({
      feature,
      prompt_hash: promptHash,
      model: result.model,
      provider,
      status: "success",
      tokens_used: result.tokens,
      requested_by: user.id,
    });

    return new Response(JSON.stringify({
      content: outputData,
      cached: false,
      model: result.model,
      tokens: result.tokens,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
