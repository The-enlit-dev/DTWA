'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  SkeletonBox,
  SkeletonText,
  EmptyState,
  ErrorState,
} from '@/components/ui/skeletons';
import Link from 'next/link';
import {
  GraduationCap,
  Check,
  Circle,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Sparkles,
} from 'lucide-react';

interface PathStep {
  title: string;
  description: string;
  resource_type?: 'glossary' | 'article';
  glossary_slug?: string;
  article_slug?: string;
}

interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  steps: PathStep[];
}

const difficultyStyles: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function getStepHref(step: PathStep): string | null {
  if (step.resource_type === 'article' && step.article_slug) {
    return `/blog/${step.article_slug}`;
  }
  if (step.resource_type === 'glossary' && step.glossary_slug) {
    return `/glossary/${step.glossary_slug}`;
  }
  // Fallback: if glossary_slug exists regardless of resource_type
  if (step.glossary_slug) return `/glossary/${step.glossary_slug}`;
  if (step.article_slug) return `/blog/${step.article_slug}`;
  return null;
}

function PathDetailContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';

  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const progressKey = slug ? `dmtwa_path_${slug}_progress` : '';

  // Load progress from localStorage
  useEffect(() => {
    if (!progressKey) return;
    try {
      const raw = localStorage.getItem(progressKey);
      if (raw) {
        const arr = JSON.parse(raw) as number[];
        setCompleted(new Set(arr));
      }
    } catch {
      // ignore parse errors
    }
  }, [progressKey]);

  // Fetch path data
  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('learning_paths')
        .select('id, title, slug, description, difficulty, steps')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (!active) return;

      if (err) {
        setError(err.message);
      } else if (!data) {
        setError('Learning path not found.');
      } else {
        setPath(data as LearningPath);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const toggleStep = (index: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      // Persist to localStorage
      try {
        localStorage.setItem(progressKey, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const resetProgress = () => {
    setCompleted(new Set());
    try {
      localStorage.removeItem(progressKey);
    } catch {
      // ignore
    }
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-900">
        <Navbar />
        <main className="pt-20">
          <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
            <SkeletonBox className="h-5 w-24" />
            <SkeletonBox className="h-10 w-3/4" />
            <SkeletonBox className="h-6 w-32 rounded-full" />
            <SkeletonText lines={2} />
            <div className="glass rounded-2xl p-5 space-y-4">
              <SkeletonBox className="h-4 w-48" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <SkeletonBox className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonBox className="h-5 w-1/2" />
                    <SkeletonText lines={2} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ---- Error state ----
  if (error || !path) {
    return (
      <div className="min-h-screen bg-brand-900">
        <Navbar />
        <main className="pt-20">
          <div className="max-w-3xl mx-auto px-4 py-12">
            <ErrorState
              title={error || 'Learning path not found'}
              description="This path may have been removed or is no longer published."
            />
            <div className="text-center mt-6">
              <Link
                href="/learn"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Learning Paths
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const steps = Array.isArray(path.steps) ? path.steps : [];
  const totalSteps = steps.length;
  const completedCount = completed.size;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/learn"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> All Learning Paths
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-brand-blue" />
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                  difficultyStyles[path.difficulty] || difficultyStyles.beginner
                }`}
              >
                {path.difficulty}
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl text-white mb-3">{path.title}</h1>
            <p className="text-gray-400 text-base leading-relaxed">{path.description}</p>
          </div>
        </section>

        {/* Progress bar */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {completedCount} of {totalSteps} steps completed
                </span>
                {completedCount === totalSteps && totalSteps > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Complete!
                  </span>
                )}
              </div>
              {completedCount > 0 && (
                <button
                  onClick={resetProgress}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Progress
                </button>
              )}
            </div>
            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-blue via-brand-purple to-brand-pink transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{progressPct}% complete</p>
          </div>
        </section>

        {/* Timeline / Steps */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {totalSteps === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No steps in this path yet"
              description="This learning path is being assembled. Check back soon."
            />
          ) : (
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-white/8" />

              <div className="space-y-4">
                {steps.map((step, index) => {
                  const isDone = completed.has(index);
                  const href = getStepHref(step);
                  const isLast = index === totalSteps - 1;

                  return (
                    <div
                      key={index}
                      className="relative flex gap-4 items-start group"
                    >
                      {/* Number circle / checkmark */}
                      <button
                        onClick={() => toggleStep(index)}
                        aria-label={isDone ? `Mark step ${index + 1} as incomplete` : `Mark step ${index + 1} as complete`}
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all border-2 ${
                          isDone
                            ? 'bg-gradient-to-br from-brand-blue to-brand-purple border-transparent text-white shadow-lg shadow-brand-blue/20'
                            : 'bg-brand-800 border-white/10 text-gray-400 hover:border-brand-blue/50 hover:text-white'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </button>

                      {/* Step content */}
                      <div
                        className={`glass rounded-xl p-4 flex-1 transition-all cursor-pointer ${
                          isDone ? 'border-brand-blue/20 opacity-75' : 'hover:border-white/15'
                        }`}
                        onClick={() => toggleStep(index)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-white text-sm mb-1 ${isDone ? 'line-through decoration-white/20' : ''}`}>
                              {step.title}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>

                        {/* Link to resource */}
                        {href && (
                          <div className="mt-3 pt-3 border-t border-white/6" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={href}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-blue hover:text-brand-blue/80 transition-colors"
                            >
                              {step.resource_type === 'article' ? (
                                <FileText className="w-3.5 h-3.5" />
                              ) : (
                                <BookOpen className="w-3.5 h-3.5" />
                              )}
                              Read {step.resource_type === 'article' ? 'article' : 'glossary term'}
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom actions */}
          {totalSteps > 0 && (
            <div className="mt-8 flex items-center justify-between">
              <Link
                href="/learn"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> All paths
              </Link>
              {completedCount === totalSteps && totalSteps > 0 && (
                <Link
                  href="/glossary"
                  className="inline-flex items-center gap-2 btn-gradient px-5 py-2.5 text-white font-medium rounded-xl text-sm"
                >
                  <Sparkles className="w-4 h-4" /> Explore more concepts
                </Link>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function LearningPathDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-900">
          <Navbar />
          <main className="pt-20">
            <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
              <SkeletonBox className="h-10 w-3/4" />
              <SkeletonText lines={3} />
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <PathDetailContent />
    </Suspense>
  );
}
