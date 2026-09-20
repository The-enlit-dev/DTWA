'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, BarChart2, BookOpen, Cpu, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const benefits = [
  { icon: Cpu, title: '3 AI Tool Reviews', desc: 'Every week, we pick the tools worth your attention.' },
  { icon: BarChart2, title: '1 Company Deep Dive', desc: 'Funding, strategy, and what it means for the market.' },
  { icon: TrendingUp, title: 'Top Trends', desc: 'The most important AI movements, decoded simply.' },
  { icon: BookOpen, title: '5-Minute Read', desc: 'Dense insights, zero fluff. Respect for your time.' },
];

export default function NewsletterSignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    const { error: err } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, name, is_confirmed: true });

    setLoading(false);
    if (err) {
      setError(err.code === '23505' ? "You're already subscribed!" : 'Something went wrong. Try again.');
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-brand-blue/15 border border-brand-blue/30 rounded-full px-4 py-2 mb-6">
            <Mail className="w-4 h-4 text-brand-blue" />
            <span className="text-brand-blue text-sm font-medium">Free Newsletter</span>
          </div>
          <h1 className="font-display font-bold text-5xl text-white mb-5">
            Decode AI with{' '}
            <span className="gradient-text">Attharva</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-xl mx-auto">
            Every week, get the most important AI news, tool discoveries, and company analysis — explained simply.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {benefits.map((b) => (
            <div key={b.title} className="glass rounded-xl p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center mx-auto mb-3">
                <b.icon className="w-5 h-5 text-brand-blue" />
              </div>
              <div className="font-semibold text-white text-sm mb-1">{b.title}</div>
              <div className="text-xs text-gray-500">{b.desc}</div>
            </div>
          ))}
        </div>

        {/* Signup form */}
        <div className="gradient-border rounded-2xl p-8 md:p-10">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="font-display font-bold text-2xl text-white mb-2">
                Welcome to the community!
              </h2>
              <p className="text-gray-400">You&apos;ll get the next issue straight to your inbox.</p>
            </div>
          ) : (
            <>
              <h2 className="font-display font-bold text-2xl text-white text-center mb-6">
                Join thousands of AI enthusiasts
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gradient py-3.5 text-white font-semibold rounded-xl text-base disabled:opacity-50"
                >
                  {loading ? 'Subscribing...' : 'Subscribe for Free'}
                </button>
              </form>
              {error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}
              <p className="text-gray-600 text-xs text-center mt-4">No spam. Unsubscribe anytime.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
