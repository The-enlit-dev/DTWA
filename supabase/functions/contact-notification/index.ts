import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { name, email, subject, message } = await req.json();

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#1e293b;border-bottom:2px solid #3b82f6;padding-bottom:8px">New Contact Message</h2>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;width:120px">From</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${name}</td></tr>
<tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600">Email</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0"><a href="mailto:${email}">${email}</a></td></tr>
<tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600">Subject</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${subject}</td></tr>
</table>
<div style="background:#f8fafc;border-left:4px solid #3b82f6;padding:16px;margin-top:16px;border-radius:0 8px 8px 0">
  <p style="margin:0;white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
</div>
<p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent from decodingtomorrowwithattharva.netlify.app contact form</p>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Decoding Tomorrow <notifications@decodingtomorrowwithattharva.netlify.app>",
        to: ["decodingtomorrowwithattharva@gmail.com"],
        reply_to: email,
        subject: `[Contact Form] ${subject} — from ${name}`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: `Resend error: ${errText}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
