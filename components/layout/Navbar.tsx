'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Youtube, LogOut, LayoutDashboard, ChevronDown, Cpu, BookOpen, Wand2, Calculator, Settings, ExternalLink, Rocket, Trophy, FolderGit2, Target, Lightbulb, Gamepad2, BarChart3, FileText, Building2, Newspaper, Scale, Star, MessageCircle, GraduationCap } from 'lucide-react';
import SearchOverlay from './SearchOverlay';
import { supabase } from '@/lib/supabase';
import { useCommunitySettings, useCommunityClick } from '@/lib/community';

const contentLinks = [
  { label: 'Blog', href: '/blog', icon: FileText, desc: 'Deep dives & guides' },
  { label: 'News', href: '/news', icon: Newspaper, desc: 'Latest AI headlines' },
  { label: 'Reviews', href: '/reviews', icon: Star, desc: 'Tool & service reviews' },
  { label: 'Companies', href: '/companies', icon: Building2, desc: 'AI company profiles' },
  { label: 'Compare', href: '/compare', icon: Scale, desc: 'Side-by-side comparisons' },
  { label: 'Videos', href: '/videos', icon: Youtube, desc: 'Video content' },
];

const exploreLinks = [
  { label: 'AI Tools', href: '/tools', icon: Cpu, desc: 'Browse & compare AI tools' },
  { label: 'Learning Hub', href: '/learning-hub', icon: BookOpen, desc: 'PDFs, guides & study notes' },
  { label: 'Courses', href: '/courses', icon: GraduationCap, desc: 'Free interactive AI courses' },
  { label: 'AI Glossary', href: '/glossary', icon: BookOpen, desc: '50+ terms explained simply' },
  { label: 'Tool Finder', href: '/tool-finder', icon: Wand2, desc: 'Find your perfect AI tool' },
  { label: 'Learn AI', href: '/learn', icon: GraduationCap, desc: 'Step-by-step AI learning paths' },
  { label: 'Daily AI Hub', href: '/daily', icon: BarChart3, desc: 'AI update, tool & term of the day' },
  { label: 'AI Careers', href: '/careers', icon: Rocket, desc: 'Explore AI career paths' },
  { label: 'Cost Calculator', href: '/calculator', icon: Calculator, desc: 'Estimate your AI spend' },
];

const playLinks = [
  { label: 'Startup Simulator', href: '/simulator', icon: Gamepad2, desc: 'Build a virtual AI company' },
  { label: 'Prediction Market', href: '/predictions', icon: Trophy, desc: 'Forecast the future of AI' },
  { label: 'Build in Public', href: '/projects', icon: FolderGit2, desc: 'Showcase your projects' },
  { label: 'AI Skill Tree', href: '/skills', icon: Target, desc: 'Level up your AI skills' },
  { label: 'Weekly Challenges', href: '/challenges', icon: Rocket, desc: 'Compete and win XP' },
  { label: 'Business Ideas Vault', href: '/ideas', icon: Lightbulb, desc: 'Find your next startup idea' },
  { label: 'Leaderboards', href: '/leaderboard', icon: BarChart3, desc: 'Top players & builders' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [playOpen, setPlayOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLDivElement>(null);
  const communityRef = useRef<HTMLDivElement>(null);
  const { settings: communitySettings } = useCommunitySettings();
  const trackClick = useCommunityClick();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setDropdownOpen(false); setContentOpen(false); setExploreOpen(false); setPlayOpen(false); setCommunityOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) setContentOpen(false);
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setExploreOpen(false);
      if (playRef.current && !playRef.current.contains(e.target as Node)) setPlayOpen(false);
      if (communityRef.current && !communityRef.current.contains(e.target as Node)) setCommunityOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        supabase.from('profiles').select('username, role, avatar_url').eq('id', session.user.id).maybeSingle()
          .then(({ data }) => setProfile(data));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        supabase.from('profiles').select('username, role, avatar_url').eq('id', session.user.id).maybeSingle()
          .then(({ data }) => setProfile(data));
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    setMobileOpen(false);
  };

  const isAdmin = profile?.role && ['admin', 'super_admin'].includes(profile.role);
  const initials = (profile?.username || user?.email || 'U').charAt(0).toUpperCase();

  const dropdownItems = [
    { label: 'Content', links: contentLinks, ref: contentRef, open: contentOpen, setOpen: setContentOpen },
    { label: 'Explore', links: exploreLinks, ref: exploreRef, open: exploreOpen, setOpen: setExploreOpen },
    { label: 'Play', links: playLinks, ref: playRef, open: playOpen, setOpen: setPlayOpen },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-brand-900/90 backdrop-blur-xl border-b border-white/8 shadow-lg shadow-black/20' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/decoding_tomorow_logo copy.png" alt="Decoding Tomorrow With Attharva" width={38} height={38} className="rounded-full" />
              <div className="hidden sm:block leading-tight">
                <span className="font-display font-bold text-white text-sm">Decoding </span>
                <span className="font-display font-bold gradient-text text-sm">Tomorrow</span>
                <div className="font-display text-[10px] text-gray-400 font-medium tracking-wide">With Attharva</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {/* About link */}
              <Link href="/about" className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                About
              </Link>

              {/* Content dropdown */}
              <div className="relative" ref={contentRef}>
                <button
                  onClick={() => { setContentOpen(!contentOpen); setExploreOpen(false); setPlayOpen(false); setCommunityOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors rounded-lg ${
                    contentOpen ? 'text-white bg-white/8' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Content
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${contentOpen ? 'rotate-180' : ''}`} />
                </button>
                {contentOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 glass border border-white/12 rounded-xl shadow-xl py-2 z-50">
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Articles & Media</p>
                    {contentLinks.map(({ label, href, icon: Icon, desc }) => (
                      <Link key={href} href={href} onClick={() => setContentOpen(false)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/6 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue/12 border border-brand-blue/20 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-brand-blue" />
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium group-hover:text-brand-blue transition-colors">{label}</div>
                          <div className="text-xs text-gray-500">{desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Explore dropdown */}
              <div className="relative" ref={exploreRef}>
                <button
                  onClick={() => { setExploreOpen(!exploreOpen); setContentOpen(false); setPlayOpen(false); setCommunityOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors rounded-lg ${
                    exploreOpen ? 'text-white bg-white/8' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Explore
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
                </button>
                {exploreOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 glass border border-white/12 rounded-xl shadow-xl py-2 z-50">
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">AI Tools & Resources</p>
                    {exploreLinks.map(({ label, href, icon: Icon, desc }) => (
                      <Link key={href} href={href} onClick={() => setExploreOpen(false)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/6 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue/12 border border-brand-blue/20 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-brand-blue" />
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium group-hover:text-brand-blue transition-colors">{label}</div>
                          <div className="text-xs text-gray-500">{desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Play dropdown */}
              <div className="relative" ref={playRef}>
                <button
                  onClick={() => { setPlayOpen(!playOpen); setContentOpen(false); setExploreOpen(false); setCommunityOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors rounded-lg ${
                    playOpen ? 'text-white bg-white/8' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Play
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${playOpen ? 'rotate-180' : ''}`} />
                </button>
                {playOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 glass border border-white/12 rounded-xl shadow-xl py-2 z-50">
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Interactive</p>
                    {playLinks.map(({ label, href, icon: Icon, desc }) => (
                      <Link key={href} href={href} onClick={() => setPlayOpen(false)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/6 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue/12 border border-brand-blue/20 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-brand-blue" />
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium group-hover:text-brand-blue transition-colors">{label}</div>
                          <div className="text-xs text-gray-500">{desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Community dropdown */}
              <div className="relative" ref={communityRef}>
                <button
                  onClick={() => { setCommunityOpen(!communityOpen); setContentOpen(false); setExploreOpen(false); setPlayOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors rounded-lg ${
                    communityOpen ? 'text-white bg-white/8' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Community
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${communityOpen ? 'rotate-180' : ''}`} />
                </button>
                {communityOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 glass border border-white/12 rounded-xl shadow-xl py-2 z-50">
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Join Us</p>
                    <Link href="/community" onClick={() => setCommunityOpen(false)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/6 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-brand-blue/12 border border-brand-blue/20 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-brand-blue" />
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium group-hover:text-brand-blue transition-colors">Community Page</div>
                        <div className="text-xs text-gray-500">Learn about our community</div>
                      </div>
                    </Link>
                    <a
                      href={communitySettings.discord_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick('discord', 'navbar')}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/6 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#5865F2]/12 border border-[#5865F2]/20 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium group-hover:text-[#5865F2] transition-colors">Join Discord</div>
                        <div className="text-xs text-gray-500">Chat in real time</div>
                      </div>
                    </a>
                    <a
                      href={communitySettings.reddit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick('reddit', 'navbar')}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/6 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#FF4500]/12 border border-[#FF4500]/20 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.197-.547-.66 3.005c1.555.07 2.956.547 3.934 1.27.4-.333.913-.535 1.473-.535 1.27 0 2.298 1.029 2.298 2.298 0 .89-.508 1.66-1.252 2.045-.034.145-.052.294-.052.448 0 2.236-2.626 4.05-5.866 4.05s-5.866-1.814-5.866-4.05c0-.154-.018-.303-.052-.448-.744-.385-1.252-1.155-1.252-2.045 0-1.27 1.028-2.298 2.298-2.298.56 0 1.073.202 1.473.535.978-.723 2.379-1.2 3.934-1.27l.743-3.395a.249.249 0 0 1 .27-.19l2.413.601c.226-.466.7-.786 1.25-.786zM8.5 11.5c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm7 0c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm-3.5 6.5c-1.105 0-2 .895-2 2 0 1.105.895 2 2 2s2-.895 2-2c0-1.105-.895-2-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium group-hover:text-[#FF4500] transition-colors">Join Reddit</div>
                        <div className="text-xs text-gray-500">Discuss & share</div>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white glass rounded-lg border border-white/8 hover:border-brand-blue/40 transition-all"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
                <span className="hidden md:block text-xs">Search</span>
                <kbd className="hidden md:block text-xs bg-white/8 px-1.5 py-0.5 rounded text-gray-500">⌘K</kbd>
              </button>

              <a
                href="https://www.youtube.com/@DecodingTomorrowWithAttharva"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Youtube className="w-4 h-4" />
                <span className="hidden md:block">Subscribe</span>
              </a>

              {/* Auth section */}
              {user ? (
                <div className="relative hidden lg:block" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl glass border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-blue text-xs font-bold">
                      {initials}
                    </div>
                    <span className="text-sm text-gray-300 max-w-[80px] truncate">{profile?.username || 'You'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 glass border border-white/10 rounded-xl shadow-xl py-1 z-50">
                      <div className="px-3 py-2.5 border-b border-white/8 mb-1">
                        <p className="text-xs font-semibold text-white truncate">{profile?.username}</p>
                        <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-brand-blue/20 text-brand-blue capitalize font-medium">
                          {profile?.role?.replace('_', ' ')}
                        </span>
                      </div>
                      <Link href="/account" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        <Settings className="w-3.5 h-3.5" /> Account Settings
                      </Link>
                      <Link href="/saved" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        <BookOpen className="w-3.5 h-3.5" /> Saved Content
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-brand-blue hover:text-blue-300 hover:bg-brand-blue/8 transition-colors font-medium">
                          <LayoutDashboard className="w-3.5 h-3.5" /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-white/8 mt-1 pt-1">
                        <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/8 transition-colors">
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="hidden lg:block text-sm text-gray-300 hover:text-white px-3 py-2 transition-colors">
                  Sign in
                </Link>
              )}

              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-gray-400 hover:text-white" aria-label="Toggle menu">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden glass border-t border-white/8">
            <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
              <Link href="/about" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                About
              </Link>
              {dropdownItems.map((dd) => (
                <div key={dd.label} className="pt-2 border-t border-white/8">
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{dd.label}</p>
                  {dd.links.map(({ label, href, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                      <Icon className="w-4 h-4 text-brand-blue" /> {label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="pt-2 border-t border-white/8">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Community</p>
                <Link href="/community" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                  <MessageCircle className="w-4 h-4 text-brand-blue" /> Community Page
                </Link>
                <a
                  href={communitySettings.discord_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick('discord', 'navbar_mobile')}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.010c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                  Join Discord
                </a>
                <a
                  href={communitySettings.reddit_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick('reddit', 'navbar_mobile')}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.197-.547-.66 3.005c1.555.07 2.956.547 3.934 1.27.4-.333.913-.535 1.473-.535 1.27 0 2.298 1.029 2.298 2.298 0 .89-.508 1.66-1.252 2.045-.034.145-.052.294-.052.448 0 2.236-2.626 4.05-5.866 4.05s-5.866-1.814-5.866-4.05c0-.154-.018-.303-.052-.448-.744-.385-1.252-1.155-1.252-2.045 0-1.27 1.028-2.298 2.298-2.298.56 0 1.073.202 1.473.535.978-.723 2.379-1.2 3.934-1.27l.743-3.395a.249.249 0 0 1 .27-.19l2.413.601c.226-.466.7-.786 1.25-.786zM8.5 11.5c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm7 0c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm-3.5 6.5c-1.105 0-2 .895-2 2 0 1.105.895 2 2 2s2-.895 2-2c0-1.105-.895-2-2-2z" /></svg>
                  Join Reddit
                </a>
              </div>
              <div className="pt-3 border-t border-white/8">
                {user ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-blue text-sm font-bold">{initials}</div>
                      <div>
                        <p className="text-sm text-white">{profile?.username || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-brand-blue rounded-lg hover:bg-brand-blue/10 font-medium">
                        <LayoutDashboard className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5">
                      <Settings className="w-4 h-4" /> Account Settings
                    </Link>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 rounded-lg hover:bg-red-400/10 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2.5 text-sm text-gray-300 hover:text-white border border-white/10 rounded-lg transition-colors">
                      Sign in
                    </Link>
                    <a href="https://www.youtube.com/@DecodingTomorrowWithAttharva" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg">
                      <Youtube className="w-4 h-4" /> Subscribe
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
