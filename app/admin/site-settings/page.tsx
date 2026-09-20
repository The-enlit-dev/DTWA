'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Settings,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Globe,
  Mail,
  Share2,
  Search,
  Image as ImageIcon,
  Type,
  X,
} from 'lucide-react';

const inputClass =
  'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

interface SiteSettings {
  id?: string;
  site_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
  contact_email: string;
  social_links: {
    twitter?: string;
    youtube?: string;
    instagram?: string;
    linkedin?: string;
  };
  default_seo_title: string;
  default_meta_description: string;
  default_og_image: string;
  footer_text: string;
}

const defaultSettings: SiteSettings = {
  site_name: 'Decoding Tomorrow With Attharva',
  tagline: 'AI, Business & Technology — Explained Simply',
  logo_url: '',
  favicon_url: '',
  contact_email: '',
  social_links: { twitter: '', youtube: '', instagram: '', linkedin: '' },
  default_seo_title:
    'Decoding Tomorrow With Attharva — AI, Business & Technology',
  default_meta_description:
    'Deep dives on AI tools, companies, and the trends shaping tomorrow — explained simply.',
  default_og_image: '',
  footer_text: '© Decoding Tomorrow With Attharva. All rights reserved.',
};

export default function AdminSiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (err) {
        setError(err.message);
      } else if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
          social_links: {
            ...defaultSettings.social_links,
            ...(data.social_links || {}),
          },
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    const payload = {
      ...settings,
      social_links: settings.social_links,
      updated_at: new Date().toISOString(),
    };
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1)
      .maybeSingle();
    let res;
    if (existing?.id) {
      res = await supabase
        .from('site_settings')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .limit(1)
        .maybeSingle();
    } else {
      res = await supabase
        .from('site_settings')
        .insert(payload)
        .select()
        .limit(1)
        .maybeSingle();
    }
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setSettings((p) => ({ ...p, [key]: value }));

  const updateSocial = (key: string, value: string) =>
    setSettings((p) => ({
      ...p,
      social_links: { ...p.social_links, [key]: value },
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-blue" /> Site Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage global site configuration, branding, and SEO defaults
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/20 bg-red-500/5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400 flex-1">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-400/50 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="glass rounded-xl p-3 border border-green-500/20 bg-green-500/5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400">Settings saved successfully</p>
        </div>
      )}

      {/* Branding */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <Type className="w-4 h-4 text-brand-blue" /> Branding
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Site Name</label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => update('site_name', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => update('tagline', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Logo URL</label>
            <input
              type="text"
              value={settings.logo_url}
              onChange={(e) => update('logo_url', e.target.value)}
              placeholder="/logo.png"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Favicon URL</label>
            <input
              type="text"
              value={settings.favicon_url}
              onChange={(e) => update('favicon_url', e.target.value)}
              placeholder="/favicon.ico"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <Mail className="w-4 h-4 text-brand-blue" /> Contact
        </h3>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Contact Email</label>
          <input
            type="email"
            value={settings.contact_email}
            onChange={(e) => update('contact_email', e.target.value)}
            placeholder="contact@example.com"
            className={inputClass}
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <Share2 className="w-4 h-4 text-brand-blue" /> Social Links
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {(
            [
              ['twitter', 'Twitter / X URL'],
              ['youtube', 'YouTube URL'],
              ['instagram', 'Instagram URL'],
              ['linkedin', 'LinkedIn URL'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input
                type="text"
                value={settings.social_links[key] || ''}
                onChange={(e) => updateSocial(key, e.target.value)}
                placeholder={`https://${key}.com/...`}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* SEO Defaults */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <Search className="w-4 h-4 text-brand-blue" /> Default SEO
        </h3>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Default SEO Title{' '}
            <span className="text-gray-600">
              ({settings.default_seo_title.length} chars)
            </span>
          </label>
          <input
            type="text"
            value={settings.default_seo_title}
            onChange={(e) => update('default_seo_title', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Default Meta Description{' '}
            <span className="text-gray-600">
              ({settings.default_meta_description.length} chars)
            </span>
          </label>
          <textarea
            value={settings.default_meta_description}
            onChange={(e) => update('default_meta_description', e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> Default OG Image URL
          </label>
          <input
            type="text"
            value={settings.default_og_image}
            onChange={(e) => update('default_og_image', e.target.value)}
            placeholder="/og-default.png"
            className={inputClass}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-blue" /> Footer
        </h3>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Footer Text</label>
          <textarea
            value={settings.footer_text}
            onChange={(e) => update('footer_text', e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={save}
        disabled={saving}
        className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
