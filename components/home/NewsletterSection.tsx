'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('dt_subscribed') === '1') {
      setHidden(true);
      return;
    }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.email) return;
      const { data } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', session.user.email)
        .maybeSingle();
      if (data) {
        setHidden(true);
        localStorage.setItem('dt_subscribed', '1');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    const { error: err } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, is_confirmed: true });

    setLoading(false);
    if (err) {
      setError(err.code === '23505' ? 'You are already subscribed!' : 'Something went wrong. Please try again.');
    } else {
      setSuccess(true);
      setEmail('');
      if (typeof window !== 'undefined') localStorage.setItem('dt_subscribed', '1');
    }
  };

  if (hidden) return null;

  return (
    <section className="gradient-border rounded-2xl overflow-hidden">
      <div className="p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 via-brand-purple/5 to-brand-pink/5 pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-brand-blue/15 border border-brand-blue/30 rounded-full px-4 py-1.5 mb-5">
            <Zap className="w-3.5 h-3.5 text-brand-blue" />
            <span className="text-brand-blue text-sm font-medium">Free Weekly Newsletter</span>
          </div>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">
            Stay Ahead of the <span className="gradient-text">AI Curve</span>
          </h2>
          <p className="text-gray-400 text-base mb-8 max-w-md mx-auto">
            Every week: 3 AI tool reviews, 1 company deep dive, and the most important AI news — all in 5 minutes.
          </p>
          {success ? (
            <div className="flex items-center justify-center gap-3 text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-lg font-medium">You&apos;re subscribed! Welcome aboard.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1 relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-brand-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/60 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-gradient flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-xl text-sm shrink-0 disabled:opacity-50"
              >
                {loading ? 'Subscribing...' : <><Mail className="w-4 h-4" /> Subscribe Free</>}
              </button>
            </form>
          )}
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <p className="text-gray-600 text-xs mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}
