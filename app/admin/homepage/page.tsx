'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Home, Save, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, ArrowUp, ArrowDown, Settings2 } from 'lucide-react';

const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

export default function HomepageBuilderPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('sort_order', { ascending: true });
      if (err) setError(err.message);
      setSections(data || []);
      setLoading(false);
    })();
  }, []);

  const toggleSection = async (id: string, enabled: boolean) => {
    const { error: err } = await supabase
      .from('homepage_sections')
      .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) { setError(err.message); return; }
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, is_enabled: enabled } : s)));
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];

    // Update sort_order in DB
    const updates = newSections.map((s, i) => ({ id: s.id, sort_order: i }));
    await Promise.all(
      updates.map((u) =>
        supabase.from('homepage_sections').update({ sort_order: u.sort_order, updated_at: new Date().toISOString() }).eq('id', u.id)
      )
    );

    setSections(newSections);
  };

  const saveConfig = async (id: string, config: any) => {
    setSaving(true);
    const { error: err } = await supabase
      .from('homepage_sections')
      .update({ config, updated_at: new Date().toISOString() })
      .eq('id', id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setEditingKey(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-brand-blue animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <Home className="w-5 h-5 text-brand-blue" /> Homepage Builder
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Enable, disable, and reorder homepage sections</p>
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
          <p className="text-sm text-green-400">Homepage updated successfully</p>
        </div>
      )}

      {/* Sections list */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`glass rounded-xl p-4 border transition-all ${section.is_enabled ? 'border-white/8' : 'border-white/4 opacity-60'}`}
          >
            <div className="flex items-center gap-3">
              {/* Order controls */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => moveSection(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveSection(index, 'down')}
                  disabled={index === sections.length - 1}
                  className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Section info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{section.section_label}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Order: {section.sort_order} · {section.is_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditingKey(editingKey === section.id ? null : section.id)}
                  className="p-2 text-gray-400 hover:text-white glass rounded-lg border border-white/8"
                  title="Configure section"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleSection(section.id, !section.is_enabled)}
                  className={`p-2 rounded-lg border transition-colors ${section.is_enabled ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-gray-500 glass border-white/8'}`}
                  title={section.is_enabled ? 'Disable' : 'Enable'}
                >
                  {section.is_enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Config editor (for hero section) */}
            {editingKey === section.id && section.section_key === 'hero' && (
              <HeroConfigEditor
                section={section}
                onSave={(config) => saveConfig(section.id, config)}
                saving={saving}
              />
            )}

            {editingKey === section.id && section.section_key !== 'hero' && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs text-gray-500">This section uses content from the database automatically. No manual configuration needed.</p>
                <button onClick={() => setEditingKey(null)} className="text-xs text-brand-blue mt-2">Close</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroConfigEditor({ section, onSave, saving }: { section: any; onSave: (config: any) => void; saving: boolean }) {
  const [title, setTitle] = useState(section.config?.title || '');
  const [description, setDescription] = useState(section.config?.description || '');

  return (
    <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Hero Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Decoding Tomorrow With Attharva" className={inputClass} />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Hero Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Deep dives on AI tools, companies, and the trends shaping tomorrow." className={`${inputClass} resize-none`} />
      </div>
      <button
        onClick={() => onSave({ title, description })}
        disabled={saving}
        className="btn-gradient flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save Config
      </button>
    </div>
  );
}
