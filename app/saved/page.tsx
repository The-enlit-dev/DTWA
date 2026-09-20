'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  Bookmark,
  Trash2,
  FileText,
  Wrench,
  BookOpen,
  ArrowRight,
  Loader2,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface BookmarkItem {
  id: string;
  content_type: 'article' | 'tool' | 'glossary';
  content_id: string;
  content_slug: string;
  created_at: string;
}

interface EnrichedItem extends BookmarkItem {
  title: string;
  href: string;
}

// ============================================
// HELPERS
// ============================================
const STORAGE_KEY = 'dmtwa_bookmarks';

function readLocalBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BookmarkItem[];
  } catch {
    return [];
  }
}

function writeLocalBookmarks(items: BookmarkItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function typeMeta(type: string) {
  switch (type) {
    case 'article':
      return { label: 'Articles', icon: FileText, color: 'text-brand-orange', href: (slug: string) => `/blog/${slug}` };
    case 'tool':
      return { label: 'Tools', icon: Wrench, color: 'text-brand-purple', href: (slug: string) => `/tools/${slug}` };
    case 'glossary':
      return { label: 'Glossary Terms', icon: BookOpen, color: 'text-brand-pink', href: (slug: string) => `/glossary/${slug}` };
    default:
      return { label: type, icon: Bookmark, color: 'text-gray-400', href: (slug: string) => '/' };
  }
}

// ============================================
// COMPONENT
// ============================================
export default function SavedContentPage() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  // Load bookmarks (auth or local)
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;

      if (session) {
        setSignedIn(true);
        const { data } = await supabase
          .from('bookmarks')
          .select('id, content_type, content_id, content_slug, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        const fetched = (data || []) as BookmarkItem[];
        setItems(fetched);
        await enrichTitles(fetched);
      } else {
        setSignedIn(false);
        const local = readLocalBookmarks();
        setItems(local);
        await enrichTitles(local);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  // Fetch titles from relevant tables
  const enrichTitles = async (bookmarks: BookmarkItem[]) => {
    const byType: Record<string, { ids: string[]; slugs: string[] }> = {
      article: { ids: [], slugs: [] },
      tool: { ids: [], slugs: [] },
      glossary: { ids: [], slugs: [] },
    };

    bookmarks.forEach((b) => {
      if (byType[b.content_type]) {
        byType[b.content_type].ids.push(b.content_id);
        if (b.content_slug) byType[b.content_type].slugs.push(b.content_slug);
      }
    });

    const titleMap: Record<string, string> = {};

    // Articles
    if (byType.article.ids.length > 0) {
      const { data } = await supabase
        .from('articles')
        .select('id, title, slug')
        .in('id', byType.article.ids.filter((id) => id.match(/^[0-9a-f]{8}-/i)));
      (data || []).forEach((a: any) => {
        titleMap[`article:${a.id}`] = a.title;
      });
    }

    // Tools
    if (byType.tool.ids.length > 0) {
      // tool_of_day_id may be a slug, so try both id and slug
      const uuidIds = byType.tool.ids.filter((id) => id.match(/^[0-9a-f]{8}-/i));
      const slugIds = byType.tool.ids.filter((id) => !id.match(/^[0-9a-f]{8}-/i));
      const queries = [];
      if (uuidIds.length) queries.push(supabase.from('ai_tools').select('id, name, slug').in('id', uuidIds));
      if (slugIds.length) queries.push(supabase.from('ai_tools').select('id, name, slug').in('slug', slugIds));
      const results = await Promise.all(queries);
      results.forEach(({ data }) => {
        (data || []).forEach((t: any) => {
          titleMap[`tool:${t.id}`] = t.name;
          if (t.slug) titleMap[`tool_slug:${t.slug}`] = t.name;
        });
      });
    }

    // Glossary
    if (byType.glossary.ids.length > 0) {
      const uuidIds = byType.glossary.ids.filter((id) => id.match(/^[0-9a-f]{8}-/i));
      const slugIds = byType.glossary.ids.filter((id) => !id.match(/^[0-9a-f]{8}-/i));
      const queries = [];
      if (uuidIds.length) queries.push(supabase.from('glossary_terms').select('id, term, slug').in('id', uuidIds));
      if (slugIds.length) queries.push(supabase.from('glossary_terms').select('id, term, slug').in('slug', slugIds));
      const results = await Promise.all(queries);
      results.forEach(({ data }) => {
        (data || []).forEach((g: any) => {
          titleMap[`glossary:${g.id}`] = g.term;
          if (g.slug) titleMap[`glossary_slug:${g.slug}`] = g.term;
        });
      });
    }

    setTitles(titleMap);
  };

  const getTitle = (item: BookmarkItem): string => {
    const byId = titles[`${item.content_type}:${item.content_id}`];
    if (byId) return byId;
    if (item.content_slug) {
      const bySlug = titles[`${item.content_type}_slug:${item.content_slug}`];
      if (bySlug) return bySlug;
    }
    return item.content_slug || item.content_id || 'Untitled';
  };

  const getHref = (item: BookmarkItem): string => {
    const meta = typeMeta(item.content_type);
    return meta.href(item.content_slug || item.content_id);
  };

  const handleRemove = useCallback(async (item: BookmarkItem) => {
    // Optimistic removal
    setRemoved((prev) => new Set(prev).add(item.id));
    setItems((prev) => prev.filter((b) => b.id !== item.id));

    if (signedIn) {
      await supabase.from('bookmarks').delete().eq('id', item.id).eq('user_id', item.content_id);
    } else {
      const current = readLocalBookmarks();
      writeLocalBookmarks(current.filter((b) => b.id !== item.id));
    }
  }, [signedIn]);

  // Group by content type
  const grouped: Record<string, BookmarkItem[]> = {};
  items.forEach((item) => {
    if (!grouped[item.content_type]) grouped[item.content_type] = [];
    grouped[item.content_type].push(item);
  });

  const typeOrder = ['article', 'tool', 'glossary'];

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-brand-blue" />
              </div>
              <div>
                <h1 className="font-display font-bold text-4xl text-white">Saved Content</h1>
                <p className="text-gray-400 mt-1">
                  {signedIn
                    ? 'Your bookmarks, synced to your account.'
                    : 'Your bookmarks are saved locally in your browser. Sign in to sync across devices.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              <span className="ml-3 text-gray-500 text-sm">Loading your saved content…</span>
            </div>
          ) : items.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/8 mb-5">
                <Bookmark className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">
                No saved content yet
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                Browse content to start saving. Bookmark articles, tools, and glossary terms
                to find them quickly later.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 btn-gradient px-5 py-2.5 text-white font-medium rounded-xl text-sm"
                >
                  <FileText className="w-4 h-4" /> Browse Articles
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 glass border border-white/10 text-gray-300 font-medium rounded-xl text-sm px-5 py-2.5 hover:border-white/20 transition-all"
                >
                  <Wrench className="w-4 h-4" /> Explore Tools
                </Link>
                <Link
                  href="/glossary"
                  className="inline-flex items-center gap-2 glass border border-white/10 text-gray-300 font-medium rounded-xl text-sm px-5 py-2.5 hover:border-white/20 transition-all"
                >
                  <BookOpen className="w-4 h-4" /> Glossary
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {typeOrder.map((type) => {
                const group = grouped[type];
                if (!group || group.length === 0) return null;
                const meta = typeMeta(type);
                const Icon = meta.icon;

                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                      <h2 className="font-display font-semibold text-lg text-white">
                        {meta.label}
                      </h2>
                      <span className="text-sm text-gray-500">({group.length})</span>
                    </div>
                    <div className="space-y-2">
                      {group.map((item) => {
                        const title = getTitle(item);
                        const href = getHref(item);
                        return (
                          <div
                            key={item.id}
                            className="glass rounded-xl p-4 flex items-center justify-between gap-4 group"
                          >
                            <Link
                              href={href}
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              <div className={`w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0`}>
                                <Icon className={`w-4 h-4 ${meta.color}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-white truncate group-hover:text-brand-blue transition-colors">
                                  {title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {href}
                                </p>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2 shrink-0">
                              <Link
                                href={href}
                                className="p-2 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10 transition-all"
                                aria-label="Open"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleRemove(item)}
                                className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-all"
                                aria-label="Remove bookmark"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Sign-in prompt for anonymous users */}
              {!signedIn && (
                <div className="glass rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white font-medium mb-1">
                      Sync your bookmarks
                    </p>
                    <p className="text-xs text-gray-500">
                      Sign in to save bookmarks across all your devices.
                    </p>
                  </div>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 btn-gradient px-5 py-2.5 text-white font-medium rounded-xl text-sm shrink-0"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
