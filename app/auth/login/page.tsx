'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, LogIn, Chrome } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, force_password_change')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.force_password_change) {
        router.push('/auth/change-password');
        return;
      }
      if (profile?.role && ['admin', 'super_admin', 'editor'].includes(profile.role)) {
        router.push('/admin');
        return;
      }
      router.push('/');
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-brand-800 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full orb-blue opacity-20 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full orb-purple opacity-15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
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
          <h1 className="font-display font-bold text-2xl text-white text-center mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm text-center mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="Email address"
                required
                className={inputClass}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Password"
                required
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-3.5 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-gray-600">OR</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-white text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Chrome className="w-4 h-4" />
            Continue with Google
          </button>

          <div className="text-center mt-6 pt-6 border-t border-white/8">
            <p className="text-gray-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-brand-blue hover:text-blue-300 font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-400">
            ← Back to Decoding Tomorrow
          </Link>
        </div>
      </div>
    </div>
  );
}
