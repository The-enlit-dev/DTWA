'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, ExternalLink, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', short_description: '', website_url: '',
    funding_stage: '', total_funding: '', valuation: '', headquarters: '',
    founders: '', employees_count: '', founded_year: '',
  });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false }).limit(100);
    setCompanies(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

  const logoFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, '');
      return `https://logo.clearbit.com/${domain}`;
    } catch { return ''; }
  };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const { error } = await supabase.from('companies').insert({
      ...form,
      slug: form.slug || slugify(form.name),
      logo_url: form.website_url ? logoFromUrl(form.website_url) : '',
      founders: form.founders.split(',').map(s => s.trim()).filter(Boolean),
      founded_year: form.founded_year ? Number(form.founded_year) : null,
    });
    setSaving(false);
    if (!error) { setShowForm(false); fetch(); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this company?')) return;
    await supabase.from('companies').delete().eq('id', id);
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-xl text-white">Companies</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm">
          <Plus className="w-4 h-4" /> Add Company
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-white">New Company</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-xs text-gray-500 mb-1 block">Name *</label><input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Website URL</label><input type="url" value={form.website_url} onChange={e => setForm(p => ({...p, website_url: e.target.value}))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Funding Stage</label><input type="text" value={form.funding_stage} onChange={e => setForm(p => ({...p, funding_stage: e.target.value}))} placeholder="Series B" className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Total Funding</label><input type="text" value={form.total_funding} onChange={e => setForm(p => ({...p, total_funding: e.target.value}))} placeholder="$1.2B" className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Valuation</label><input type="text" value={form.valuation} onChange={e => setForm(p => ({...p, valuation: e.target.value}))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Headquarters</label><input type="text" value={form.headquarters} onChange={e => setForm(p => ({...p, headquarters: e.target.value}))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Founders (comma-separated)</label><input type="text" value={form.founders} onChange={e => setForm(p => ({...p, founders: e.target.value}))} className={inputClass} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Founded Year</label><input type="number" value={form.founded_year} onChange={e => setForm(p => ({...p, founded_year: e.target.value}))} className={inputClass} /></div>
            <div className="sm:col-span-2"><label className="text-xs text-gray-500 mb-1 block">Short Description</label><textarea value={form.short_description} onChange={e => setForm(p => ({...p, short_description: e.target.value}))} rows={2} className={`${inputClass} resize-none`} /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-gradient px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Add Company'}</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/8">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Funding</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Valuation</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-white/4">
            {loading ? <tr><td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td></tr> :
              companies.map(c => (
                <tr key={c.id} className="hover:bg-white/2">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand-700 border border-white/8 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-brand-blue" />
                      </div>
                      <p className="text-sm text-white">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">{c.total_funding || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-400">{c.valuation || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/companies/${c.slug}`} target="_blank" className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => del(c.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
