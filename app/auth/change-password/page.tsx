'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle2, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { error: pwErr } = await supabase.auth.updateUser({ password: form.password });
    if (pwErr) { setError(pwErr.message); setLoading(false); return; }

    await supabase.from('profiles').update({ force_password_change: false }).eq('id', user.id);
    setSuccess(true);
    setTimeout(() => router.push('/admin'), 2000);
  };

  const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 border border-white/8">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-brand-blue/15 border border-brand-blue/30 mx-auto mb-6">
            <Shield className="w-7 h-7 text-brand-blue" />
          </div>

          {success ? (
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl text-white mb-2">Password Updated!</h2>
              <p className="text-gray-400 text-sm">Redirecting to admin dashboard...</p>
            </div>
          ) : (
            <>
              <h1 className="font-display font-bold text-2xl text-white text-center mb-2">Set New Password</h1>
              <p className="text-gray-500 text-sm text-center mb-8">
                You must set a new password before continuing.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="password" value={form.password} onChange={(e) => setForm(p => ({...p, password: e.target.value}))} placeholder="New password" required className={inputClass} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="password" value={form.confirm} onChange={(e) => setForm(p => ({...p, confirm: e.target.value}))} placeholder="Confirm new password" required className={inputClass} />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="w-full btn-gradient py-3.5 text-white font-semibold rounded-xl disabled:opacity-50">
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
