'use client';

import { useEffect, useState, useCallback } from 'react';
import { List, ChevronRight } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

function extractHeadings(content: string): Heading[] {
  const lines = content.split('\n');
  const headings: Heading[] = [];
  for (const line of lines) {
    if (line.startsWith('### ')) {
      const text = line.replace(/^###\s+/, '').trim();
      headings.push({ id: text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), text, level: 3 });
    } else if (line.startsWith('## ')) {
      const text = line.replace(/^##\s+/, '').trim();
      headings.push({ id: text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), text, level: 2 });
    }
  }
  return headings;
}

interface Props {
  content: string;
  className?: string;
}

export default function TableOfContents({ content, className = '' }: Props) {
  const [activeId, setActiveId] = useState('');
  const [open, setOpen] = useState(false);
  const headings = extractHeadings(content);

  const onScroll = useCallback(() => {
    const scrollY = window.scrollY + 120;
    let current = '';
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el && el.offsetTop <= scrollY) current = h.id;
    }
    setActiveId(current);
  }, [headings]);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' });
      setOpen(false);
    }
  };

  if (headings.length < 3) return null;

  return (
    <nav className={`${className}`} aria-label="Table of contents">
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 glass rounded-xl border border-white/8 text-sm text-white mb-2"
      >
        <span className="flex items-center gap-2 font-semibold">
          <List className="w-4 h-4 text-brand-blue" /> Table of Contents
        </span>
        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {/* Content — always visible on lg, toggle on mobile */}
      <div className={`glass rounded-xl border border-white/8 overflow-hidden ${open ? '' : 'hidden lg:block'}`}>
        <div className="px-4 py-3 border-b border-white/8 hidden lg:flex items-center gap-2">
          <List className="w-4 h-4 text-brand-blue" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contents</p>
        </div>
        <ul className="py-2">
          {headings.map((h) => (
            <li key={h.id}>
              <button
                onClick={() => scrollTo(h.id)}
                className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-start gap-2 group ${
                  h.level === 3 ? 'pl-7' : ''
                } ${
                  activeId === h.id
                    ? 'text-brand-blue bg-brand-blue/8'
                    : 'text-gray-400 hover:text-white hover:bg-white/4'
                }`}
              >
                {h.level === 2 && (
                  <span className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${activeId === h.id ? 'bg-brand-blue' : 'bg-gray-600'}`} />
                )}
                <span className="leading-relaxed">{h.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
