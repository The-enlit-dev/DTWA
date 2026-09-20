'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard, FileText, Youtube, Cpu, Building2, MessageSquare,
  Mail, LogOut, Menu, X, ChevronRight, Users, BarChart2, MessageSquarePlus,
  Tag, UserCog, ExternalLink, Settings, Zap, BookOpen,
  Gamepad2, Trophy, FolderGit2, Target, Rocket, Lightbulb,
  Shield, Home, Bell, Scale, MessageCircle, GraduationCap,
  Activity, Wand2, Rss, Search, Share2, ImageIcon, FolderSearch, Flag, Calendar,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navSections = [
  {
    label: 'Content',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/articles', label: 'Blog Posts', icon: FileText },
      { href: '/admin/tools', label: 'AI Tools', icon: Cpu },
      { href: '/admin/glossary', label: 'Glossary', icon: BookOpen },
      { href: '/admin/companies', label: 'Companies', icon: Building2 },
      { href: '/admin/compare', label: 'Comparisons', icon: Scale },
      { href: '/admin/categories', label: 'Categories', icon: Tag },
      { href: '/admin/videos', label: 'Videos', icon: Youtube },
      { href: '/admin/media-library', label: 'Media Library', icon: ImageIcon },
      { href: '/admin/reports', label: 'Content Reports', icon: Flag },
    ],
  },
  {
    label: 'AI',
    items: [
      { href: '/admin/ai-creator', label: 'Creator Studio', icon: Wand2 },
      { href: '/admin/ai-researcher', label: 'Tool Researcher', icon: FolderSearch },
      { href: '/admin/ai-settings', label: 'AI Settings', icon: Settings },
      { href: '/admin/ai-usage', label: 'AI Usage', icon: BarChart2 },
    ],
  },
  {
    label: 'Automation',
    items: [
      { href: '/admin/blog-automation', label: 'Blog Automation', icon: Rss },
      { href: '/admin/social-media', label: 'Social Media', icon: Share2 },
      { href: '/admin/newsletter', label: 'Newsletters', icon: Mail },
      { href: '/admin/daily', label: 'Daily AI Hub', icon: Calendar },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/admin/live-visitors', label: 'Live Visitors', icon: Activity },
      { href: '/admin/analytics', label: 'Content Analytics', icon: BarChart2 },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
      { href: '/admin/projects', label: 'Projects', icon: FolderGit2 },
      { href: '/admin/predictions', label: 'Predictions', icon: Trophy },
      { href: '/admin/challenges', label: 'Challenges', icon: Rocket },
      { href: '/admin/ideas', label: 'Ideas Vault', icon: Lightbulb },
    ],
  },
  {
    label: 'Learn',
    items: [
      { href: '/admin/learning-hub', label: 'Learning Hub', icon: BookOpen },
      { href: '/admin/courses', label: 'Courses', icon: GraduationCap },
      { href: '/admin/skills', label: 'Skill Tree', icon: Target },
      { href: '/admin/simulator', label: 'Simulator', icon: Gamepad2 },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/homepage', label: 'Homepage Builder', icon: Home },
      { href: '/admin/navigation', label: 'Navigation', icon: MessageCircle },
      { href: '/admin/site-settings', label: 'Site Settings', icon: Settings },
      { href: '/admin/team', label: 'Admin Team', icon: UserCog },
      { href: '/admin/moderation', label: 'Moderation', icon: Shield },
      { href: '/admin/feedback', label: 'Feedback', icon: MessageSquarePlus },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
      { href: '/admin/community', label: 'Community Settings', icon: MessageCircle },
    ],
  },
];

// Flat list for active-check
const allNavItems = navSections.flatMap((s) => s.items);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

      if (!prof || !['admin', 'super_admin', 'editor'].includes(prof.role)) {
        router.push('/');
        return;
      }

      setUser(user);
      setProfile(prof);
      setLoading(false);
    })();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href) && href !== '/admin';

  const initials = (profile?.username || user?.email || 'A').charAt(0).toUpperCase();
  const roleLabel = profile?.role?.replace('_', ' ') || 'editor';
  const isSuperAdmin = profile?.role === 'super_admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-brand-900 border-r border-white/8 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/8">
          <div className="relative">
            <Image src="/my_good_picture_for_pfp.png" alt="DT" width={32} height={32} className="rounded-full" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-brand-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-white text-sm truncate">Decoding Tomorrow</div>
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-brand-blue" /> Admin Panel
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white p-1 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-2 mb-1.5 text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href, (item as any).exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                        active
                          ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                          : 'text-gray-400 hover:text-white hover:bg-white/6'
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="px-3 py-3 border-t border-white/8 space-y-0.5">
          <Link
            href="/account"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/6 transition-all"
          >
            <Settings className="w-4 h-4" /> Account Settings
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/6 transition-all"
          >
            <ExternalLink className="w-4 h-4" /> View Site
          </Link>
        </div>

        {/* User card */}
        <div className="px-3 pb-4 pt-1">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8">
            <div className="w-7 h-7 rounded-full bg-brand-blue/25 border border-brand-blue/40 flex items-center justify-center text-brand-blue font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{profile?.username || 'Admin'}</div>
              <div className={`text-[10px] capitalize font-medium ${isSuperAdmin ? 'text-brand-blue' : 'text-gray-500'}`}>
                {roleLabel}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-brand-950/90 backdrop-blur-xl border-b border-white/8 px-4 sm:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/8 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb hint */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 flex-1">
            <span className="text-gray-700">Admin</span>
            <span className="text-gray-800">/</span>
            <span className="text-gray-400 capitalize">
              {pathname === '/admin' ? 'Dashboard' : pathname.split('/').pop()?.replace(/-/g, ' ')}
            </span>
          </div>
          <div className="flex-1 sm:flex-none" />

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Site
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border border-white/8 text-xs text-gray-400">
              <div className="w-5 h-5 rounded-full bg-brand-blue/25 border border-brand-blue/40 flex items-center justify-center text-brand-blue text-[10px] font-bold">
                {initials}
              </div>
              <span className="hidden md:block truncate max-w-[100px]">{profile?.username || user?.email}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
