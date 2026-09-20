'use client';

import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BookmarkButton({ articleId }: { articleId: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) { setLoading(false); return; }
      setSignedIn(true);
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (active) { setBookmarked(!!data); setLoading(false); }
    })();
    return () => { active = false; };
  }, [articleId]);

  const toggle = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/auth/login';
      return;
    }
    if (bookmarked) {
      await supabase.from('bookmarks').delete().eq('article_id', articleId).eq('user_id', session.user.id);
      setBookmarked(false);
    } else {
      await supabase.from('bookmarks').insert({ article_id: articleId, user_id: session.user.id });
      setBookmarked(true);
    }
  };

  if (!signedIn && !loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark article'}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
        bookmarked
          ? 'bg-brand-blue/20 border-brand-blue/40 text-brand-blue'
          : 'glass border-white/8 text-gray-400 hover:text-white hover:border-white/20'
      }`}
    >
      <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-brand-blue' : ''}`} />
      {bookmarked ? 'Saved' : 'Bookmark'}
    </button>
  );
}
