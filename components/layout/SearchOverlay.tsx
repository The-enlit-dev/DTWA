'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, FileText, Cpu, Building2 } from 'lucide-react';

const quickLinks = [
  { label: 'AI Tools Directory', href: '/tools', icon: Cpu },
  { label: 'Company Database', href: '/companies', icon: Building2 },
  { label: 'Trending Now', href: '/trending', icon: TrendingUp },
  { label: 'Latest Articles', href: '/blog', icon: FileText },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-brand-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl">
        <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-4 border-b border-white/8">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, tools, companies..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-base outline-none"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-white/8 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </form>

          <div className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quick Links</p>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white"
                >
                  <link.icon className="w-4 h-4 text-brand-blue" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="px-4 pb-4">
            <p className="text-xs text-gray-600 text-center">
              Press <kbd className="bg-white/8 px-1.5 py-0.5 rounded text-gray-500">Enter</kbd> to search &middot;{' '}
              <kbd className="bg-white/8 px-1.5 py-0.5 rounded text-gray-500">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
