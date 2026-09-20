'use client';

import { useState } from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminSetupPage() {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const promoteToAdmin = async () => {
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('You must be signed in.'); setLoading(false); return; }

    const { data: existing } = await supabase
      .from('profiles')
      .select('role')
      .eq('role', 'super_admin')
      .maybeSingle();

    if (existing) { setError('A super admin already exists. Setup is complete.'); setLoading(false); return; }

    const { error: err } = await supabase
      .from('profiles')
      .update({ role: 'super_admin', force_password_change: false })
      .eq('id', user.id);

    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 border border-white/8 text-center">
          <div className="w-16 h-16 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-brand-blue" />
          </div>

          {done ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="font-display font-bold text-2xl text-white mb-2">Admin Setup Complete!</h2>
              <p className="text-gray-400 mb-6 text-sm">Your account has been promoted to Super Admin.</p>
              <a href="/admin" className="btn-gradient px-6 py-3 text-white font-semibold rounded-xl inline-block text-sm">
                Go to Admin Dashboard
              </a>
            </>
          ) : (
            <>
              <h1 className="font-display font-bold text-2xl text-white mb-2">Admin Setup</h1>
              <p className="text-gray-400 mb-6 text-sm">
                This page is only functional once — when no super admin exists. Sign in with your account and click below to claim admin.
              </p>
              {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
              <button
                onClick={promoteToAdmin}
                disabled={loading}
                className="w-full btn-gradient py-3.5 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Claim Super Admin'}
              </button>
              <p className="text-gray-600 text-xs mt-4">
                You must be signed in to use this page. <a href="/auth/login" className="text-brand-blue">Sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
