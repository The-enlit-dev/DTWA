'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BusinessIdea } from '@/lib/types';
import {
  Lightbulb,
  Search,
  Bookmark,
  Star,
  TrendingUp,
  DollarSign,
  Tag,
  ChevronDown,
  X,
  Loader2,
} from 'lucide-react';

const DIFFICULTY_STYLES: Record<BusinessIdea['difficulty'], string> = {
  easy: 'bg-green-400/10 border-green-400/30 text-green-400',
  medium: 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400',
  hard: 'bg-red-400/10 border-red-400/30 text-red-400',
};

interface UserRating {
  rating: number;
}

export function IdeasClient({ ideas }: { ideas: BusinessIdea[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState<'all' | BusinessIdea['difficulty']>('all');

  // Per-idea interaction state
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  // Local optimistic copies of mutable counts
  const [ideaState, setIdeaState] = useState<BusinessIdea[]>(ideas);

  useEffect(() => {
    setIdeaState(ideas);
  }, [ideas]);

  // Derive filter option lists from data
  const categories = useMemo(() => {
    const set = new Set<string>();
    ideas.forEach((i) => i.category && set.add(i.category));
    return Array.from(set).sort();
  }, [ideas]);

  // Auth + hydration of user ratings / bookmarks
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthChecked(true);
      if (!session?.user) return;
      setUserId(session.user.id);

      const [ratingsRes, bookmarksRes] = await Promise.all([
        supabase
          .from('idea_ratings')
          .select('idea_id, rating')
          .eq('user_id', session.user.id),
        supabase
          .from('idea_bookmarks')
          .select('idea_id')
          .eq('user_id', session.user.id),
      ]);

      const rMap: Record<string, number> = {};
      (ratingsRes.data || []).forEach((r: { idea_id: string; rating: number }) => {
        rMap[r.idea_id] = r.rating;
      });
      setUserRatings(rMap);

      const bSet = new Set<string>();
      (bookmarksRes.data || []).forEach((b: { idea_id: string }) => bSet.add(b.idea_id));
      setBookmarkedIds(bSet);
    })();
  }, []);

  // Filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ideaState.filter((idea) => {
      if (category !== 'all' && idea.category !== category) return false;
      if (difficulty !== 'all' && idea.difficulty !== difficulty) return false;
      if (!q) return true;
      const inTitle = idea.title.toLowerCase().includes(q);
      const inPitch = idea.pitch.toLowerCase().includes(q);
      const inTags = (idea.tags || []).some((t) => t.toLowerCase().includes(q));
      return inTitle || inPitch || inTags;
    });
  }, [ideaState, search, category, difficulty]);

  const requireAuth = (): boolean => {
    if (!authChecked) return false;
    if (!userId) {
      router.push('/auth/login');
      return false;
    }
    return true;
  };

  // ---- Rating ----
  const handleRate = async (idea: BusinessIdea, newRating: number) => {
    if (!requireAuth()) return;
    const existing = userRatings[idea.id];
    if (existing === newRating) return; // no-op, same rating

    setBusyId(idea.id);
    try {
      // Upsert into idea_ratings (UNIQUE idea_id + user_id)
      const { error: upsertError } = await supabase
        .from('idea_ratings')
        .upsert(
          { idea_id: idea.id, user_id: userId, rating: newRating },
          { onConflict: 'idea_id,user_id' }
        );
      if (upsertError) throw upsertError;

      // Recompute rating_sum / rating_count on business_ideas
      let nextSum: number;
      let nextCount: number;
      if (existing === undefined) {
        nextSum = idea.rating_sum + newRating;
        nextCount = idea.rating_count + 1;
      } else {
        nextSum = idea.rating_sum - existing + newRating;
        nextCount = idea.rating_count; // unchanged
      }

      const { error: updateError } = await supabase
        .from('business_ideas')
        .update({ rating_sum: nextSum, rating_count: nextCount })
        .eq('id', idea.id);
      if (updateError) throw updateError;

      // Award XP only on first rating (mirrors prediction_vote pattern)
      if (existing === undefined) {
        await supabase.rpc('award_xp', {
          target_user_id: userId,
          xp_amount: 10,
          activity_type: 'idea_rate',
          activity_title: `Rated idea: ${idea.title}`,
          activity_link: '/ideas',
        });
      }

      setUserRatings((prev) => ({ ...prev, [idea.id]: newRating }));
      setIdeaState((prev) =>
        prev.map((i) =>
          i.id === idea.id
            ? { ...i, rating_sum: nextSum, rating_count: nextCount }
            : i
        )
      );
    } catch (err) {
      console.error('Rating failed:', err);
    } finally {
      setBusyId(null);
    }
  };

  // ---- Bookmark ----
  const handleBookmark = async (idea: BusinessIdea) => {
    if (!requireAuth()) return;
    const isBookmarked = bookmarkedIds.has(idea.id);
    setBusyId(idea.id);
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('idea_bookmarks')
          .delete()
          .eq('idea_id', idea.id)
          .eq('user_id', userId);
        if (error) throw error;

        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(idea.id);
          return next;
        });
        setIdeaState((prev) =>
          prev.map((i) =>
            i.id === idea.id
              ? { ...i, bookmark_count: Math.max(0, i.bookmark_count - 1) }
              : i
          )
        );
      } else {
        const { error } = await supabase
          .from('idea_bookmarks')
          .insert({ idea_id: idea.id, user_id: userId });
        if (error) throw error;

        setBookmarkedIds((prev) => new Set(prev).add(idea.id));
        setIdeaState((prev) =>
          prev.map((i) =>
            i.id === idea.id
              ? { ...i, bookmark_count: i.bookmark_count + 1 }
              : i
          )
        );
      }
    } catch (err) {
      console.error('Bookmark failed:', err);
    } finally {
      setBusyId(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setDifficulty('all');
  };

  const hasActiveFilters = search || category !== 'all' || difficulty !== 'all';

  return (
    <div>
      {/* Controls */}
      <div className="glass rounded-2xl p-4 sm:p-5 mb-8 border border-white/8">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ideas, pitches, tags…"
              className="w-full pl-10 pr-9 py-2.5 bg-brand-800 border border-white/8 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="relative min-w-[180px]">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none pl-10 pr-9 py-2.5 bg-brand-800 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-brand-blue/50 transition-colors cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Difficulty filter */}
          <div className="relative min-w-[160px]">
            <Lightbulb className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              className="w-full appearance-none pl-10 pr-9 py-2.5 bg-brand-800 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-brand-blue/50 transition-colors cursor-pointer"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 text-sm text-gray-400 hover:text-white border border-white/8 rounded-xl hover:border-white/20 transition-colors flex items-center gap-1.5 justify-center"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Showing {filtered.length} of {ideaState.length} ideas
          {!authChecked && ' · loading your activity…'}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              userRating={userRatings[idea.id]}
              isBookmarked={bookmarkedIds.has(idea.id)}
              busy={busyId === idea.id}
              onRate={(r) => handleRate(idea, r)}
              onBookmark={() => handleBookmark(idea)}
              signedIn={!!userId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Lightbulb className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No ideas match your filters.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-brand-blue hover:text-blue-300 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- Star rating ----------------

function StarRating({
  value,
  userRating,
  busy,
  signedIn,
  onRate,
}: {
  value: number; // average
  userRating?: number;
  busy: boolean;
  signedIn: boolean;
  onRate: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || userRating || 0;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label="Rate this idea"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = display >= star;
          const partial = !filled && display > star - 1 && display < star;
          return (
            <button
              key={star}
              type="button"
              disabled={busy}
              onClick={() => onRate(star)}
              onMouseEnter={() => setHover(star)}
              className="p-0.5 disabled:cursor-not-allowed group"
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              aria-pressed={userRating === star}
            >
              <Star
                className={`w-4 h-4 transition-colors ${
                  filled
                    ? 'fill-yellow-400 text-yellow-400'
                    : partial
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'text-gray-600 group-hover:text-gray-400'
                }`}
              />
            </button>
          );
        })}
      </div>
      <span className="text-xs text-gray-500 ml-0.5">
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500 ml-1" />}
      {!signedIn && (
        <span className="text-[10px] text-gray-600 ml-1 hidden sm:inline">sign in to rate</span>
      )}
    </div>
  );
}

// ---------------- Card ----------------

function IdeaCard({
  idea,
  userRating,
  isBookmarked,
  busy,
  onRate,
  onBookmark,
  signedIn,
}: {
  idea: BusinessIdea;
  userRating?: number;
  isBookmarked: boolean;
  busy: boolean;
  onRate: (r: number) => void;
  onBookmark: () => void;
  signedIn: boolean;
}) {
  const avg = idea.rating_count > 0 ? idea.rating_sum / idea.rating_count : 0;

  return (
    <article
      id={idea.slug}
      className="glass rounded-2xl p-5 border border-white/8 hover:border-brand-blue/30 transition-all duration-300 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/30 text-brand-blue font-medium">
            {idea.category}
          </span>
          <span
            className={`text-[11px] px-2.5 py-1 rounded-full border font-medium capitalize ${DIFFICULTY_STYLES[idea.difficulty]}`}
          >
            {idea.difficulty}
          </span>
        </div>
        <button
          onClick={onBookmark}
          disabled={busy}
          className={`shrink-0 p-1.5 rounded-lg transition-all disabled:cursor-not-allowed ${
            isBookmarked
              ? 'text-brand-blue bg-brand-blue/10'
              : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark idea'}
          aria-pressed={isBookmarked}
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-brand-blue' : ''}`} />
          )}
        </button>
      </div>

      {/* Title + pitch */}
      <h3 className="font-display font-bold text-lg text-white mb-1.5 leading-snug">
        {idea.title}
      </h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-4">{idea.pitch}</p>

      {/* Stats */}
      <div className="space-y-2.5 mb-4 text-sm">
        {idea.market_size && (
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
            <span className="text-gray-400">
              <span className="text-gray-500">Market: </span>
              {idea.market_size}
            </span>
          </div>
        )}
        {idea.monetization && (
          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
            <span className="text-gray-400">
              <span className="text-gray-500">Monetization: </span>
              {idea.monetization}
            </span>
          </div>
        )}
      </div>

      {/* Tech stack */}
      {idea.tech_stack && idea.tech_stack.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {idea.tech_stack.map((tech) => (
              <span
                key={tech}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {idea.tags && idea.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {idea.tags.map((t) => (
            <span key={t} className="text-[10px] text-gray-500">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Footer: rating + bookmark count */}
      <div className="mt-auto pt-4 border-t border-white/6 flex items-center justify-between gap-3">
        <StarRating
          value={avg}
          userRating={userRating}
          busy={busy}
          signedIn={signedIn}
          onRate={onRate}
        />
        <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
          <Bookmark className="w-3 h-3" />
          {idea.bookmark_count}
        </span>
      </div>
    </article>
  );
}
