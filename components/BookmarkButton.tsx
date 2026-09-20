'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'dmtwa_bookmarks';

interface BookmarkItem {
  type: string;
  id: string;
  slug: string;
}

interface BookmarkButtonProps {
  contentType: string;
  contentId: string;
  contentSlug: string;
}

function getLocalBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalBookmarks(items: BookmarkItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export default function BookmarkButton({ contentType, contentId, contentSlug }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Check session + initial bookmark state
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .maybeSingle();
        if (mounted) setBookmarked(!!data);
      } else {
        // anonymous — check localStorage
        const local = getLocalBookmarks();
        setBookmarked(
          local.some((b) => b.type === contentType && b.id === contentId)
        );
      }
    })();
    return () => { mounted = false; };
  }, [contentType, contentId]);

  // Sync local bookmarks to server when user logs in
  useEffect(() => {
    if (!userId) return;
    const local = getLocalBookmarks();
    if (local.length === 0) return;
    (async () => {
      for (const item of local) {
        await supabase
          .from('bookmarks')
          .upsert(
            { user_id: userId, content_type: item.type, content_id: item.id, content_slug: item.slug },
            { onConflict: 'user_id,content_type,content_id' }
          );
      }
      setLocalBookmarks([]);
    })();
  }, [userId]);

  async function toggleBookmark() {
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked); // optimistic update

    if (newBookmarked) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }

    // Track event (fire and forget)
    supabase.rpc('record_content_event', {
      p_event_type: 'bookmark',
      p_content_type: contentType,
      p_content_id: contentId,
      p_content_slug: contentSlug,
    });

    if (userId) {
      if (newBookmarked) {
        await supabase
          .from('bookmarks')
          .insert({ user_id: userId, content_type: contentType, content_id: contentId, content_slug: contentSlug });
      } else {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('content_type', contentType)
          .eq('content_id', contentId);
      }
    } else {
      // anonymous — localStorage
      const local = getLocalBookmarks();
      if (newBookmarked) {
        setLocalBookmarks([...local, { type: contentType, id: contentId, slug: contentSlug }]);
      } else {
        setLocalBookmarks(local.filter((b) => !(b.type === contentType && b.id === contentId)));
      }
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        onClick={toggleBookmark}
        aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
          bookmarked
            ? 'bg-brand-blue/15 border-brand-blue/40 text-brand-blue'
            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      </button>
      {showToast && (
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          Saved!
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-blue rotate-45" />
        </span>
      )}
    </div>
  );
}
