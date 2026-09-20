'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Cpu, BookOpen, Building2, Scale, Activity, BarChart2, Home, Settings, Wand2, Share2, Mail, Rss, Shield, Users, Image as ImageIcon, FolderSearch, LayoutDashboard, Tag, Youtube, ArrowRight } from 'lucide-react';

const COMMANDS = [
  // Public
  { section: 'Navigate', items: [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Blog', href: '/blog', icon: FileText },
    { label: 'AI Tools', href: '/tools', icon: Cpu },
    { label: 'Glossary', href: '/glossary', icon: BookOpen },
    { label: 'Companies', href: '/companies', icon: Building2 },
    { label: 'Comparisons', href: '/compare', icon: Scale },
    { label: 'Learn', href: '/learn', icon: BookOpen },
    { label: 'Careers', href: '/careers', icon: LayoutDashboard },
    { label: 'Daily AI', href: '/daily', icon: Activity },
    { label: 'Tool Finder', href: '/tool-finder', icon: Search },
    { label: 'Saved Content', href: '/saved', icon: FileText },
    { label: 'Search', href: '/search', icon: Search },
  ]},
  // Admin
  { section: 'Admin', items: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'New Article', href: '/admin/articles/new', icon: FileText },
    { label: 'AI Creator Studio', href: '/admin/ai-creator', icon: Wand2 },
    { label: 'AI Settings', href: '/admin/ai-settings', icon: Settings },
    { label: 'AI Usage', href: '/admin/ai-usage', icon: BarChart2 },
    { label: 'Live Visitors', href: '/admin/live-visitors', icon: Activity },
    { label: 'Homepage Builder', href: '/admin/homepage', icon: Home },
    { label: 'Navigation', href: '/admin/navigation', icon: BookOpen },
    { label: 'Site Settings', href: '/admin/site-settings', icon: Settings },
    { label: 'SEO Manager', href: '/admin/seo', icon: BarChart2 },
    { label: 'Media Library', href: '/admin/media-library', icon: ImageIcon },
    { label: 'Blog Automation', href: '/admin/blog-automation', icon: Rss },
    { label: 'Social Media', href: '/admin/social-media', icon: Share2 },
    { label: 'Newsletter', href: '/admin/newsletter', icon: Mail },
    { label: 'Tool Researcher', href: '/admin/ai-researcher', icon: FolderSearch },
    { label: 'Daily Content', href: '/admin/daily', icon: Activity },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Categories', href: '/admin/categories', icon: Tag },
    { label: 'Videos', href: '/admin/videos', icon: Youtube },
    { label: 'Moderation', href: '/admin/moderation', icon: Shield },
  ]},
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const allCommands = COMMANDS.flatMap(s => s.items.map(i => ({ ...i, section: s.section })));
  const filtered = query.trim()
    ? allCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : allCommands;

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.section]) acc[cmd.section] = [];
    acc[cmd.section].push(cmd);
    return acc;
  }, {} as Record<string, typeof allCommands>);

  const handleSelect = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) handleSelect(filtered[activeIndex].href);
    }
  };

  if (!open) return null;

  let runningIndex = -1;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-lg px-4">
        <div className="glass rounded-2xl border border-white/12 overflow-hidden shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search commands or pages..."
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
            />
            <kbd className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto py-2">
            {Object.keys(grouped).length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">No commands found.</div>
            ) : (
              Object.entries(grouped).map(([section, items]) => (
                <div key={section} className="mb-2">
                  <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-700 uppercase tracking-wider">{section}</p>
                  {items.map((cmd) => {
                    runningIndex++;
                    const isActive = runningIndex === activeIndex;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.href + cmd.label}
                        onClick={() => handleSelect(cmd.href)}
                        onMouseEnter={() => setActiveIndex(runningIndex)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${isActive ? 'bg-brand-blue/15' : 'hover:bg-white/4'}`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-blue' : 'text-gray-500'}`} />
                        <span className={`text-sm flex-1 ${isActive ? 'text-white' : 'text-gray-300'}`}>{cmd.label}</span>
                        {isActive && <ArrowRight className="w-3.5 h-3.5 text-brand-blue" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
