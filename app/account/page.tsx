'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import {
  User, Mail, Shield, Calendar, Save, Loader2, CheckCircle2,
  AlertCircle, Eye, EyeOff, KeyRound, LayoutDashboard, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setUser(user);
      setProfile(prof);
      setUsername(prof?.username || '');
      setLoading(false);
    })();
  }, [router]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setSaveError('Username cannot be empty.'); return; }
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    const { error } = await supabase.from('profiles').update({ username: username.trim() }).eq('id', user.id);
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setProfile((p: any) => ({ ...p, username: username.trim() }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    setPwSaving(true);
    setPwError('');
    setPwSuccess(false);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) { setPwError(error.message); return; }
    setPwSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPwSuccess(false), 3000);
  };

  const isAdmin = profile?.role && ['admin', 'super_admin'].includes(profile.role);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="text-gray-500 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Account Settings</h1>
              <p className="text-gray-500 text-sm mt-0.5">Manage your profile and security</p>
            </div>
          </div>

          {/* Profile overview card */}
          <div className="glass rounded-2xl p-5 border border-white/8 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-blue/20 border-2 border-brand-blue/40 flex items-center justify-center text-brand-blue font-bold text-xl shrink-0">
              {(profile?.username || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-base">{profile?.username || 'No username set'}</div>
              <div className="text-sm text-gray-400 truncate">{user?.email}</div>
              <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                isAdmin ? 'bg-brand-blue/20 text-brand-blue' : 'bg-white/8 text-gray-400'
              }`}>
                {profile?.role?.replace('_', ' ') || 'user'}
              </span>
            </div>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 bg-brand-blue/15 border border-brand-blue/30 text-brand-blue rounded-xl text-sm font-medium hover:bg-brand-blue/25 transition-colors shrink-0"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            )}
          </div>

          {/* Account info */}
          <div className="glass rounded-2xl border border-white/8 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-brand-blue" /> Account Info
              </h2>
            </div>
            <div className="divide-y divide-white/6">
              <div className="flex items-center gap-3 px-5 py-3.5">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm text-white">{user?.email}</div>
                </div>
                <span className="text-xs text-gray-600 bg-white/4 px-2 py-0.5 rounded">Cannot change</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3.5">
                <Shield className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Role</div>
                  <div className="text-sm text-white capitalize">{profile?.role?.replace('_', ' ') || 'user'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3.5">
                <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Member since</div>
                  <div className="text-sm text-white">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit username */}
          <form onSubmit={saveProfile} className="glass rounded-2xl border border-white/8 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-brand-blue" /> Edit Profile
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50 transition-colors"
                  placeholder="Your display name"
                />
              </div>

              {saveError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Profile updated successfully.
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>

          {/* Change password */}
          <form onSubmit={changePassword} className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-blue" /> Change Password
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50 transition-colors"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50 transition-colors"
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {pwError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Password changed successfully.
                </div>
              )}

              <button
                type="submit"
                disabled={pwSaving || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
