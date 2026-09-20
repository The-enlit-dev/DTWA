import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
  .body ul,.body ol{color:#475569;font-size:15px;line-height:1.7;padding-left:20px;margin:0 0 16px}
  .body li{margin-bottom:6px}
  .body a{color:#3b82f6;text-decoration:none}
  .body blockquote{border-left:4px solid #3b82f6;margin:0 0 16px;padding:12px 16px;background:#f0f4ff;border-radius:0 8px 8px 0}
  .body hr{border:none;border-top:1px solid #e2e8f0;margin:24px 0}
  .body strong{color:#1e293b}
  .footer{background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0}
  .footer p{color:#94a3b8;font-size:12px;margin:4px 0}
</style></head>
<body><div class="wrapper">
  <div class="header">
    <h1>Decoding Tomorrow</h1>
    <p>with Attharva &mdash; Your Weekly AI Intelligence Brief</p>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    <p>You&apos;re receiving this because you subscribed at decodingtomorrowwithattharva.netlify.app</p>
    <p>Reply &ldquo;unsubscribe&rdquo; to opt out at any time.</p>
  </div>
</div></body></html>`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // ── Auth: verify the caller is logged in ──────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing Authorization header." }, 401);
    }
    const token = authHeader.slice(7);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify JWT and get caller identity
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return json({ error: "Invalid or expired token." }, 401);
    }

    // ── Permission check: admin OR newsletter editor permission ───────────────
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role && ["admin", "super_admin"].includes(profile.role);

    if (!isAdmin) {
      const { data: perm } = await supabaseAdmin
        .from("editor_permissions")
        .select("id")
        .eq("user_id", user.id)
        .eq("content_type", "newsletter")
        .maybeSingle();

      if (!perm) {
        return json({ error: "You don't have permission to send newsletters." }, 403);
      }
    }

    // ── Resend API key check ──────────────────────────────────────────────────
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return json({
        error: "RESEND_API_KEY not configured. Add it in Supabase Dashboard → Project Settings → Edge Functions → Secrets.",
      }, 400);
    }

    // ── Determine which newsletters to send ───────────────────────────────────
    const body = await req.json().catch(() => ({}));
    let newsletters: any[] = [];

    if (body.send_now && body.subject && body.content_html) {
      newsletters = [{ id: null, subject: body.subject, content_html: body.content_html }];
    } else {
      const { data } = await supabaseAdmin
        .from("newsletters")
        .select("id, subject, content_html")
        .eq("status", "draft")
        .lte("scheduled_at", new Date().toISOString())
        .not("scheduled_at", "is", null);
      newsletters = data || [];
    }

    if (!newsletters.length) {
      return json({ message: "No newsletters to send." });
    }

    // ── Get confirmed subscribers ─────────────────────────────────────────────
    const { data: subscribers } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("email, name")
      .eq("is_confirmed", true);

    if (!subscribers?.length) {
      return json({ error: "No confirmed subscribers to send to." }, 400);
    }

    // ── Send via Resend batch API ─────────────────────────────────────────────
    let totalSent = 0;
    const batchSize = 100;

    for (const nl of newsletters) {
      const fullHtml = EMAIL_TEMPLATE(nl.subject, nl.content_html);
      let nlSent = 0;

      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);
        const res = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            batch.map((s: any) => ({
              from: "Decoding Tomorrow <onboarding@resend.dev>",
              to: [s.email],
              subject: nl.subject,
              html: fullHtml,
            }))
          ),
        });

        if (!res.ok) {
          const errText = await res.text();
          if (nlSent > 0 && nl.id) {
            await supabaseAdmin.from("newsletters").update({
              status: "sent",
              recipient_count: nlSent,
              sent_at: new Date().toISOString(),
              sent_by: user.id,
              updated_at: new Date().toISOString(),
            }).eq("id", nl.id);
          }
          return json({ error: `Resend API error: ${errText}`, partial_sent: nlSent }, 500);
        }

        nlSent += batch.length;
      }

      totalSent += nlSent;

      const now = new Date().toISOString();
      if (nl.id) {
        await supabaseAdmin.from("newsletters").update({
          status: "sent",
          recipient_count: nlSent,
          sent_at: now,
          sent_by: user.id,
          updated_at: now,
        }).eq("id", nl.id);
      } else {
        await supabaseAdmin.from("newsletters").insert({
          subject: nl.subject,
          content_html: nl.content_html,
          status: "sent",
          recipient_count: nlSent,
          sent_at: now,
          sent_by: user.id,
          updated_at: now,
        });
      }
    }

    return json({
      success: true,
      sent: totalSent,
      newsletters: newsletters.length,
    });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
