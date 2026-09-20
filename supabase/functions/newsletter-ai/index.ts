import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EMAIL_TEMPLATE = (subject: string, body: string) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
<style>
  body{margin:0;padding:0;background:#f0f2f5;font-family:'Helvetica Neue',Arial,sans-serif}
  .wrapper{max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:40px 40px 32px;text-align:center}
  .header h1{color:#ffffff;font-size:22px;margin:0 0 4px;font-weight:700}
  .header p{color:#94a3b8;font-size:13px;margin:0}
  .body{padding:36px 40px}
  .body h2{color:#1e293b;font-size:20px;margin:0 0 16px;font-weight:700}
  .body h3{color:#1e293b;font-size:16px;margin:24px 0 10px;font-weight:600}
  .body p{color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px}
  .body ul{color:#475569;font-size:15px;line-height:1.7;padding-left:20px;margin:0 0 16px}
  .body li{margin-bottom:6px}
  .footer{background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0}
  .footer p{color:#94a3b8;font-size:12px;margin:4px 0}
</style></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Decoding Tomorrow</h1>
    <p>with Attharva &mdash; Your Weekly AI Intelligence Brief</p>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    <p>You&apos;re receiving this because you subscribed at decodingtomorrowwithattharva.netlify.app</p>
    <p>Reply with &ldquo;unsubscribe&rdquo; to opt out at any time.</p>
  </div>
</div>
</body></html>`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json();
    const action: string = body.action;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── GENERATE ─────────────────────────────────────────────────
    if (action === "generate") {
      const geminiKey = Deno.env.get("GEMINI_API_KEY");
      if (!geminiKey) {
        return new Response(
          JSON.stringify({ error: "GEMINI_API_KEY not configured. Add it in Supabase Dashboard → Edge Functions → Secrets." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const [{ data: articles }, { data: tools }, { data: companies }] = await Promise.all([
        supabaseAdmin.from("articles").select("title, excerpt, slug").eq("status", "published").order("published_at", { ascending: false }).limit(5),
        supabaseAdmin.from("ai_tools").select("name, short_description, rating, category, pricing_model").order("created_at", { ascending: false }).limit(4),
        supabaseAdmin.from("companies").select("name, short_description, funding_stage, total_funding").order("created_at", { ascending: false }).limit(3),
      ]);

      const contextBlock = [
        articles?.length ? `RECENT ARTICLES:\n${articles.map((a: any) => `- ${a.title}: ${a.excerpt || ""}`).join("\n")}` : "",
        tools?.length ? `RECENT AI TOOLS REVIEWED:\n${tools.map((t: any) => `- ${t.name} (${t.category}, ${t.pricing_model}, ${t.rating}/5): ${t.short_description || ""}`).join("\n")}` : "",
        companies?.length ? `RECENT COMPANY PROFILES:\n${companies.map((c: any) => `- ${c.name} (${c.funding_stage}, ${c.total_funding}): ${c.short_description || ""}`).join("\n")}` : "",
      ].filter(Boolean).join("\n\n");

      const prompt = `You are writing the weekly "Decoding Tomorrow with Attharva" newsletter about AI, technology, and the companies shaping the future.

Here is the latest content from the site to reference and expand on:

${contextBlock || "No recent content available — write a general AI news roundup for this week."}

Write a compelling newsletter in HTML format (inner body HTML only, no <html>/<body> tags). Structure:
1. Punchy opening paragraph (2-3 sentences) about what's happening in AI this week
2. "This Week in AI Tools" section with brief takes on 2-3 tools
3. "Company Spotlight" section with insights on a notable AI company
4. "Trend to Watch" section with one important AI trend
5. A closing note from Attharva

Use <h2>, <h3>, <p>, <ul>, <li> tags. Make it conversational, insightful, and opinionated. Around 500-700 words total.`;

      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
          }),
        }
      );

      if (!aiResponse.ok) {
        const err = await aiResponse.text();
        return new Response(JSON.stringify({ error: `Gemini API error: ${err}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const generatedHtml: string = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return new Response(JSON.stringify({ html: generatedHtml }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SEND ─────────────────────────────────────────────────────
    if (action === "send") {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) {
        return new Response(
          JSON.stringify({ error: "RESEND_API_KEY not configured. Add it in Supabase Dashboard → Edge Functions → Secrets." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const subject: string = body.subject;
      const contentHtml: string = body.content_html;
      if (!subject || !contentHtml) {
        return new Response(JSON.stringify({ error: "subject and content_html are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: subscribers } = await supabaseAdmin
        .from("newsletter_subscribers")
        .select("email, name")
        .eq("is_confirmed", true);

      if (!subscribers || subscribers.length === 0) {
        return new Response(JSON.stringify({ error: "No confirmed subscribers found." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const fullHtml = EMAIL_TEMPLATE(subject, contentHtml);
      let sent = 0;
      const batchSize = 100;

      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);
        const emails = batch.map((s: any) => ({
          from: "Decoding Tomorrow <onboarding@resend.dev>",
          to: [s.email],
          subject,
          html: fullHtml,
        }));

        const res = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(emails),
        });

        if (!res.ok) {
          const errText = await res.text();
          return new Response(JSON.stringify({ error: `Resend error: ${errText}` }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        sent += batch.length;
      }

      await supabaseAdmin.from("newsletters").insert({
        subject,
        content_html: contentHtml,
        status: "sent",
        recipient_count: sent,
        sent_at: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ success: true, sent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use 'generate' or 'send'." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
