'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const TOPICS = [
  'AI Tools & Apps',
  'Company Analysis',
  'Market Trends',
  'Research & Papers',
  'Tutorials & How-tos',
  'Industry News',
  'Startups & Funding',
  'Open Source AI',
];

export default function RegisterPage() {
  const [step, setStep] = useState<'account' | 'interests'>('account');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [interests, setInterests] = useState<string[]>([]);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const toggleTopic = (t: string) =>
    setInterests((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setStep('interests');
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username, full_name: form.username } },
    });

    if (err) { setLoading(false); setError(err.message); setStep('account'); return; }

    // Save interests to profile
    if (data.user && interests.length > 0) {
      await supabase.from('profiles').update({ interests }).eq('id', data.user.id);
    }

    setLoading(false);
    setSuccess(true);
  };

  const inputClass =
    'w-full bg-brand-800 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full orb-purple opacity-20 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full orb-pink opacity-15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <Image src="/my_good_picture_for_pfp.png" alt="Decoding Tomorrow" width={60} height={60} className="rounded-full" />
            <div>
              <div className="font-display font-bold text-white text-lg">Decoding Tomorrow</div>
              <div className="text-xs text-gray-500">with Attharva</div>
            </div>
          </Link>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="font-display font-bold text-2xl text-white mb-2">Account created!</h2>
              <p className="text-gray-400 text-sm mb-6">Check your email to confirm your account, then sign in.</p>
              <Link href="/auth/login" className="btn-gradient px-6 py-2.5 text-white font-medium rounded-xl text-sm inline-block">
                Go to Sign In
              </Link>
            </div>
          ) : step === 'account' ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold">1</div>
                <div className="h-px flex-1 bg-white/10" />
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-gray-500 text-xs">2</div>
              </div>
              <h1 className="font-display font-bold text-2xl text-white text-center mb-1">Create Account</h1>
              <p className="text-gray-500 text-sm text-center mb-8">Join the Decoding Tomorrow community</p>

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={form.username} onChange={set('username')} placeholder="Username" required className={inputClass} />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="email" value={form.email} onChange={set('email')} placeholder="Email address" required className={inputClass} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Password (min 8 chars)" required className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type={showPw ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder="Confirm password" required className={inputClass} />
                </div>
                {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" className="w-full btn-gradient py-3.5 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-white/8">
                <p className="text-gray-500 text-sm">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-brand-blue hover:text-blue-300 font-medium">Sign in</Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full bg-green-500/30 border border-green-500/40 flex items-center justify-center text-green-400 text-xs">✓</div>
                <div className="h-px flex-1 bg-brand-blue/50" />
                <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold">2</div>
              </div>
              <h1 className="font-display font-bold text-2xl text-white text-center mb-1">Your Interests</h1>
              <p className="text-gray-500 text-sm text-center mb-6">Pick what you care about and we&apos;ll personalise your feed.</p>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {TOPICS.map((topic) => {
                  const selected = interests.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-2.5 rounded-xl text-sm text-left transition-all border ${
                        selected ? 'bg-brand-blue/15 border-brand-blue/40 text-brand-blue' : 'bg-brand-800/60 border-white/8 text-gray-400 hover:border-white/20 hover:text-gray-200'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>

              {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">{error}</p>}

              <button onClick={handleFinish} disabled={loading} className="w-full btn-gradient py-3.5 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                <UserPlus className="w-4 h-4" />
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              <button onClick={() => setStep('account')} className="w-full text-center mt-3 text-sm text-gray-500 hover:text-gray-300 transition-colors">
                ← Back
              </button>
            </>
          )}
        </div>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-400">← Back to Decoding Tomorrow</Link>
        </div>
      </div>
    </div>
  );
}
