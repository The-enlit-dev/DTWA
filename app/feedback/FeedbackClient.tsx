'use client';

import { useState } from 'react';
import { MessageSquarePlus, CheckCircle2, Bug, Lightbulb, MessageCircle, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const types = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-400 bg-red-400/10 border-red-400/20', desc: 'Something is broken' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', desc: 'Suggest an improvement' },
  { value: 'content', label: 'Content Feedback', icon: FileText, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', desc: 'Feedback on articles or reviews' },
  { value: 'general', label: 'General', icon: MessageCircle, color: 'text-green-400 bg-green-400/10 border-green-400/20', desc: 'Anything else' },
];

const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';

export default function FeedbackClient() {
  const [form, setForm] = useState({ name: '', email: '', type: 'general', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.message) return;
    setLoading(true);
    setError('');

    const { error: err } = await supabase.from('feedback').insert({
      name: form.name,
      email: form.email,
      type: form.type,
      subject: form.subject,
      message: form.message,
    });

    setLoading(false);
    if (err) {
      setError('Something went wrong. Please try again.');
    } else {
      setSuccess(true);
    }
  };

  const selectedType = types.find((t) => t.value === form.type)!;

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-3">Thank you!</h2>
          <p className="text-gray-400 mb-6">Your feedback has been received. Attharva personally reads every submission and will use it to improve the site.</p>
          <button
            onClick={() => { setSuccess(false); setForm({ name: '', email: '', type: 'general', subject: '', message: '' }); }}
            className="text-sm text-brand-blue hover:text-blue-300 transition-colors"
          >
            Submit another &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mx-auto mb-5">
          <MessageSquarePlus className="w-7 h-7 text-brand-blue" />
        </div>
        <h1 className="font-display font-bold text-4xl text-white mb-3">Share Your Feedback</h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Found a bug? Have an idea? Every message is read by Attharva personally.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {types.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setForm((p) => ({ ...p, type: t.value }))}
            className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
              form.type === t.value ? `${t.color} border-current` : 'bg-brand-800/50 border-white/8 text-gray-400 hover:border-white/20 hover:text-gray-200'
            }`}
          >
            <t.icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm">{t.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{t.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Your Name (optional)</label>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Email (optional)</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="For follow-up replies" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Subject *</label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
            placeholder={form.type === 'bug' ? 'e.g. Navbar not closing on mobile' : form.type === 'feature' ? 'e.g. Add dark mode toggle' : 'Brief summary'}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Message *</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            placeholder={form.type === 'bug' ? 'What happened and how to reproduce it...' : 'Tell us more...'}
            required
            rows={6}
            className={`${inputClass} resize-none`}
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !form.subject || !form.message}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${selectedType.color} border`}
        >
          <selectedType.icon className="w-4 h-4" />
          {loading ? 'Sending...' : `Submit ${selectedType.label}`}
        </button>
      </form>
    </div>
  );
}
