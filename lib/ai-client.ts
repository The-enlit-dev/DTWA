import { supabase } from '@/lib/supabase';

const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-generate`;

export interface AIResponse {
  content: any;
  cached: boolean;
  model: string;
  tokens?: number;
  error?: string;
}

export async function callAI(
  feature: string,
  input: Record<string, any>,
  options?: { skipCache?: boolean }
): Promise<AIResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { content: null, cached: false, model: '', error: 'Not authenticated' };
  }

  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        feature,
        input,
        skip_cache: options?.skipCache || false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { content: null, cached: false, model: '', error: data.error || `HTTP ${res.status}` };
    }

    return {
      content: data.content,
      cached: data.cached,
      model: data.model,
      tokens: data.tokens,
    };
  } catch (err: any) {
    return { content: null, cached: false, model: '', error: err.message };
  }
}

export async function getAISettings() {
  const { data, error } = await supabase
    .from('ai_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function updateAISettings(updates: Record<string, any>) {
  const { data: existing } = await supabase
    .from('ai_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (!existing) {
    const { data, error } = await supabase
      .from('ai_settings')
      .insert({ ...updates, updated_at: new Date().toISOString() })
      .select()
      .limit(1)
      .maybeSingle();
    return { data, error };
  }

  const { data, error } = await supabase
    .from('ai_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', existing.id)
    .select()
    .limit(1)
    .maybeSingle();
  return { data, error };
}

export async function getAIUsageStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [today, month, success, failed, cached, byFeature, lastReq] = await Promise.all([
    supabase.from('ai_usage_log').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).in('status', ['success', 'failed']),
    supabase.from('ai_usage_log').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()).in('status', ['success', 'failed']),
    supabase.from('ai_usage_log').select('*', { count: 'exact', head: true }).eq('status', 'success'),
    supabase.from('ai_usage_log').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('ai_usage_log').select('*', { count: 'exact', head: true }).eq('status', 'cached'),
    supabase.from('ai_usage_log').select('feature').in('status', ['success', 'cached']),
    supabase.from('ai_usage_log').select('feature, model, created_at').order('created_at', { ascending: false }).limit(1),
  ]);

  const featureCounts: Record<string, number> = {};
  (byFeature.data || []).forEach((r: any) => {
    featureCounts[r.feature] = (featureCounts[r.feature] || 0) + 1;
  });
  const topFeature = Object.entries(featureCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    today: today.count || 0,
    month: month.count || 0,
    success: success.count || 0,
    failed: failed.count || 0,
    cached: cached.count || 0,
    topFeature: topFeature ? topFeature[0] : '—',
    lastRequest: lastReq.data?.[0] || null,
  };
}
