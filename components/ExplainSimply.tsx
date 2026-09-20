'use client';

import { Sparkles, Loader2, X, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

const AUDIENCES = ['Like I\'m 10', 'Beginner', 'Student', 'Technical'] as const;
type Audience = typeof AUDIENCES[number];

interface ExplainSimplyProps {
  content: string;
  title: string;
  contentType: string;
}

export default function ExplainSimply({ content, title, contentType }: ExplainSimplyProps) {
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  const [hasSession, setHasSession] = useState(true);
  const [cache, setCache] = useState<Record<string, string>>({});

  async function handleAudience(selected: Audience) {
    setAudience(selected);
    const cacheKey = selected;

    // Return cached result if available
    if (cache[cacheKey]) {
      setExplanation(cache[cacheKey]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    setExplanation('');

    // Check session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setHasSession(false);
      setLoading(false);
      return;
    }

    const feature = contentType === 'glossary' ? 'glossary_simplify' : 'simplify';
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-generate`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          feature,
          input: {
            text: content,
            term: title,
            audience: selected,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        setLoading(false);
        return;
      }

      const text = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
      setExplanation(text);
      setCache((prev) => ({ ...prev, [cacheKey]: text }));
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setAudience(null);
    setExplanation('');
    setError('');
  }

  // Not logged in state
  if (!hasSession) {
    return (
      <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/5 p-4 mt-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-300">Sign in to use AI explanations</p>
            <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:text-brand-blue/80 mt-2 font-medium">
              Go to login →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-blue/30 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue/10 hover:border-brand-blue/50 transition-all text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" />
          Explain Simply
        </button>
      )}

      {/* Audience selector */}
      {open && !audience && (
        <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-200">Choose an audience:</span>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AUDIENCES.map((a) => (
              <button
                key={a}
                onClick={() => handleAudience(a)}
                className="px-3 py-2.5 rounded-lg bg-brand-800 border border-white/10 text-gray-300 hover:border-brand-blue/50 hover:text-white transition-all text-sm"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading / explanation / error */}
      {audience && (
        <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-blue" />
              <span className="text-sm font-medium text-gray-200">
                Explained for: <span className="text-brand-blue">{audience}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!loading && (
                <button
                  onClick={() => { setAudience(null); setExplanation(''); setError(''); }}
                  className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Change audience
                </button>
              )}
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-2 py-6 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
              Generating explanation...
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-2 py-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {!loading && explanation && !error && (
            <div>
              <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                {explanation}
              </div>
              <p className="text-xs text-gray-500 mt-3 italic">
                AI-generated explanation — review for accuracy
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
