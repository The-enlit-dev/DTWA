'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: err } = await supabase.from('contact_messages').insert(form);
    if (err) {
      setLoading(false);
      setError('Something went wrong. Please try again.');
      return;
    }

    // Fire notification email (best-effort — don't block on failure)
    fetch(`${SUPABASE_URL}/functions/v1/contact-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).catch(() => {});

    setLoading(false);
    setSuccess(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const inputClass =
    'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';

  if (success) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
        <h3 className="font-display font-bold text-xl text-white mb-2">Message sent!</h3>
        <p className="text-gray-400 text-sm">I&apos;ll get back to you within 48 hours.</p>
        <button onClick={() => setSuccess(false)} className="mt-5 text-sm text-brand-blue hover:text-blue-300">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Name *</label>
          <input type="text" value={form.name} onChange={set('name')} placeholder="Your name" required className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Email *</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required className={inputClass} />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Subject *</label>
        <select value={form.subject} onChange={set('subject')} required className={inputClass}>
          <option value="">Select a subject</option>
          <option value="Story Tip">Story Tip</option>
          <option value="Sponsorship">Sponsorship / Partnership</option>
          <option value="Tool Submission">Submit an AI Tool</option>
          <option value="Feedback">Feedback</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Message *</label>
        <textarea value={form.message} onChange={set('message')} placeholder="What's on your mind?" required rows={5} className={`${inputClass} resize-none`} />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="w-full btn-gradient py-3.5 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
        <Send className="w-4 h-4" />
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
