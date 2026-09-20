'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Save, Power, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

export default function AdminAISettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('ai_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (err) setError(err.message);
      setSettings(data || {
        provider: 'openrouter',
        model: 'openrouter/free',
        fallback_model: '',
        temperature: 0.7,
        max_tokens: 2048,
        daily_request_limit: 50,
        ai_enabled: true,
        system_prompt: 'You are a helpful AI assistant for Decoding Tomorrow, a platform about AI tools, companies, and technology. Write clear, accurate, and engaging content.',
      });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    const { data: existing } = await supabase.from('ai_settings').select('id').limit(1).maybeSingle();
    const payload = {
      ...settings,
      temperature: Number(settings.temperature),
      max_tokens: Number(settings.max_tokens),
      daily_request_limit: Number(settings.daily_request_limit),
      updated_at: new Date().toISOString(),
    };
    let res;
    if (existing?.id) {
      res = await supabase.from('ai_settings').update(payload).eq('id', existing.id).select().limit(1).maybeSingle();
    } else {
      res = await supabase.from('ai_settings').insert(payload).select().limit(1).maybeSingle();
    }
    setSaving(false);
    if (res.error) { setError(res.error.message); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-brand-blue animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-blue" /> AI Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure AI generation provider and limits</p>
      </div>

      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/20 bg-red-500/5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400/50 hover:text-red-400 text-xs">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="glass rounded-xl p-3 border border-green-500/20 bg-green-500/5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400">Settings saved successfully</p>
        </div>
      )}

      {/* Emergency toggle */}
      <div className="glass rounded-2xl p-5 border border-white/8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white flex items-center gap-2">
              <Power className="w-4 h-4 text-yellow-400" /> AI Generation
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Master switch for all AI features</p>
          </div>
          <button
            onClick={() => setSettings((p: any) => ({ ...p, ai_enabled: !p.ai_enabled }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${settings.ai_enabled ? 'bg-green-500' : 'bg-gray-600'}`}
          >
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${settings.ai_enabled ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: settings.ai_enabled ? '#4ade80' : '#9ca3af' }}>
          {settings.ai_enabled ? 'AI generation is ON' : 'AI generation is OFF — all AI buttons will be disabled'}
        </p>
      </div>

      {/* Provider settings */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-white text-sm">Provider Configuration</h3>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">AI Provider</label>
          <select value={settings.provider} onChange={(e) => setSettings((p: any) => ({ ...p, provider: e.target.value }))} className={inputClass}>
            <option value="openrouter">OpenRouter (Free models available)</option>
            <option value="gemini">Google Gemini</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Model</label>
          <input type="text" value={settings.model} onChange={(e) => setSettings((p: any) => ({ ...p, model: e.target.value }))} placeholder="openrouter/free" className={inputClass} />
          <p className="text-xs text-gray-600 mt-1">Use &ldquo;openrouter/free&rdquo; to auto-route to free models, or specify a model like &ldquo;meta-llama/llama-3.3-70b-instruct:free&rdquo;</p>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Fallback Model (optional)</label>
          <input type="text" value={settings.fallback_model || ''} onChange={(e) => setSettings((p: any) => ({ ...p, fallback_model: e.target.value }))} placeholder="e.g. google/gemini-flash-1.5:free" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Temperature ({settings.temperature})</label>
            <input type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={(e) => setSettings((p: any) => ({ ...p, temperature: parseFloat(e.target.value) }))} className="w-full accent-brand-blue" />
            <p className="text-xs text-gray-600 mt-0.5">Lower = focused, Higher = creative</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Max Output Tokens</label>
            <input type="number" value={settings.max_tokens} onChange={(e) => setSettings((p: any) => ({ ...p, max_tokens: e.target.value }))} min={100} max={32000} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Daily Request Limit</label>
          <input type="number" value={settings.daily_request_limit} onChange={(e) => setSettings((p: any) => ({ ...p, daily_request_limit: e.target.value }))} min={1} max={1000} className={inputClass} />
          <p className="text-xs text-gray-600 mt-1">Safety buffer to avoid consuming provider allowance. Default: 50 requests/day</p>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">System Prompt</label>
          <textarea value={settings.system_prompt} onChange={(e) => setSettings((p: any) => ({ ...p, system_prompt: e.target.value }))} rows={4} className={`${inputClass} resize-none`} />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* API key info */}
      <div className="glass rounded-xl p-4 border border-brand-blue/20 bg-brand-blue/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-300 font-medium">OpenRouter API Key Status</p>
            <p className="text-xs text-blue-400/70 mt-1">
              The API key is stored securely as an edge function secret and will never be exposed to the browser.
              The OPENROUTER_API_KEY has been added to your .env file and will be deployed as a secret.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
