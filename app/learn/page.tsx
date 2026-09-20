import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { EmptyState } from '@/components/ui/skeletons';
import Link from 'next/link';
import { GraduationCap, ArrowRight, Layers, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Learning Paths — Learn AI Step by Step',
  description:
    'Structured learning paths that take you from AI beginner to confident practitioner. Follow guided steps with curated resources.',
  openGraph: {
    title: 'Learning Paths | Decoding Tomorrow With Attharva',
    description: 'Structured learning paths that take you from AI beginner to confident practitioner.',
    type: 'website',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/learn' },
};

export const dynamic = 'force-dynamic';

export const revalidate = 3600;

async function getLearningPaths() {
  const { data } = await supabase
    .from('learning_paths')
    .select('id, title, slug, description, difficulty, steps, sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  return data || [];
}

const difficultyStyles: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default async function LearningPathsPage() {
  const paths = await getLearningPaths();

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-brand-800/50 border-b border-white/6 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-brand-blue" />
              </div>
              <div>
                <h1 className="font-display font-bold text-4xl text-white">
                  Learn AI Step by Step
                </h1>
              </div>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl">
              Structured learning paths that take you from AI beginner to confident practitioner.
              Follow guided steps with curated resources, track your progress, and build real understanding.
            </p>
          </div>
        </section>

        {/* Paths grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {paths.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No learning paths yet"
              description="We're putting together structured learning journeys. Check back soon to start learning AI step by step."
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paths.map((path: any) => {
                const stepCount = Array.isArray(path.steps) ? path.steps.length : 0;
                return (
                  <Link
                    key={path.id}
                    href={`/learn/${path.slug}?slug=${path.slug}`}
                    className="glass glass-hover rounded-2xl p-6 flex flex-col group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 border border-white/10 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-brand-blue" />
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                          difficultyStyles[path.difficulty] || difficultyStyles.beginner
                        }`}
                      >
                        {path.difficulty}
                      </span>
                    </div>

                    <h2 className="font-display font-bold text-lg text-white mb-2 group-hover:text-brand-blue transition-colors">
                      {path.title}
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1">
                      {path.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/6">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {stepCount} {stepCount === 1 ? 'step' : 'steps'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue group-hover:gap-2.5 transition-all">
                        Start Learning
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
