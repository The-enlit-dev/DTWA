import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { EmptyState } from '@/components/ui/skeletons';
import Link from 'next/link';
import {
  Newspaper,
  Wrench,
  BookOpen,
  FileText,
  Lightbulb,
  Calendar,
  ArrowRight,
  Copy,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Daily AI Hub — Your Daily Dose of AI',
  description:
    'Every day: a fresh AI update, tool of the day, term of the day, article of the day, and a prompt to try. Bookmark Decoding Tomorrow for your daily AI routine.',
  openGraph: {
    title: 'Daily AI Hub | Decoding Tomorrow With Attharva',
    description: 'Your daily dose of AI — updates, tools, terms, articles, and prompts.',
    type: 'website',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/daily' },
};

export const dynamic = 'force-dynamic';

export const revalidate = 1800; // 30 min

async function getDailyContent() {
  const today = new Date().toISOString().split('T')[0];

  // Try today's published content first
  const { data: todayData } = await supabase
    .from('daily_content')
    .select('*')
    .eq('is_published', true)
    .eq('content_date', today)
    .maybeSingle();

  if (todayData) return todayData;

  // Fall back to most recent published
  const { data: recentData } = await supabase
    .from('daily_content')
    .select('*')
    .eq('is_published', true)
    .order('content_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return recentData || null;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default async function DailyHubPage() {
  const content = await getDailyContent();

  const hasUpdate = content?.ai_update && content.ai_update.trim().length > 0;
  const hasTool = content?.tool_of_day_name && content.tool_of_day_name.trim().length > 0;
  const hasTerm = content?.term_of_day_name && content.term_of_day_name.trim().length > 0;
  const hasArticle = content?.article_of_day_title && content.article_of_day_title.trim().length > 0;
  const hasPrompt = content?.prompt_of_day && content.prompt_of_day.trim().length > 0;

  const hasAny = hasUpdate || hasTool || hasTerm || hasArticle || hasPrompt;

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-brand-800/50 border-b border-white/6 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <h1 className="font-display font-bold text-4xl text-white">Daily AI Hub</h1>
              </div>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl">
              Your daily dose of AI — a fresh update, tool, term, article, and prompt every single day.
            </p>
            {content?.content_date && (
              <p className="text-gray-500 text-sm mt-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(content.content_date)}
              </p>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!hasAny ? (
            <EmptyState
              icon={Lightbulb}
              title="Check back soon for daily AI updates"
              description="We're preparing today's AI highlights — a new update, tool, term, article, and prompt will be here shortly."
            />
          ) : (
            <div className="space-y-5">
              {/* AI Update */}
              {hasUpdate && (
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue/15 border border-brand-blue/20 flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-brand-blue" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-white">AI Update</h2>
                  </div>
                  <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                    {content.ai_update}
                  </p>
                  {content.ai_update_source && (
                    <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-white/6">
                      Source:{' '}
                      {content.ai_update_source.startsWith('http') ? (
                        <a
                          href={content.ai_update_source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-blue hover:underline"
                        >
                          {content.ai_update_source}
                        </a>
                      ) : (
                        <span className="text-gray-400">{content.ai_update_source}</span>
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* Tool of the Day */}
              {hasTool && (
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-purple/15 border border-brand-purple/20 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-brand-purple" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-white">Tool of the Day</h2>
                  </div>
                  <p className="text-white font-semibold text-base mb-1">{content.tool_of_day_name}</p>
                  <Link
                    href={`/tools/${content.tool_of_day_id || ''}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:gap-2.5 transition-all mt-2"
                  >
                    View tool details
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Term of the Day */}
              {hasTerm && (
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-pink/15 border border-brand-pink/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-brand-pink" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-white">Term of the Day</h2>
                  </div>
                  <p className="text-white font-semibold text-base mb-1">{content.term_of_day_name}</p>
                  <Link
                    href={`/glossary/${content.term_of_day_slug || ''}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:gap-2.5 transition-all mt-2"
                  >
                    Read full definition
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Article of the Day */}
              {hasArticle && (
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-orange" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-white">Article of the Day</h2>
                  </div>
                  <p className="text-white font-semibold text-base mb-1">{content.article_of_day_title}</p>
                  <Link
                    href={`/blog/${content.article_of_day_slug || ''}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:gap-2.5 transition-all mt-2"
                  >
                    Read article
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Prompt of the Day — client-side copyable */}
              {hasPrompt && (
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-green-400" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-white">Prompt of the Day</h2>
                    {content.prompt_of_day_category && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-gray-400">
                        {content.prompt_of_day_category}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <pre className="bg-brand-950 border border-white/8 rounded-xl p-4 overflow-x-auto text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {content.prompt_of_day}
                    </pre>
                    <button
                      aria-label="Copy prompt"
                      data-copy-text={content.prompt_of_day}
                      className="absolute top-3 right-3 p-2 rounded-lg glass border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />

      {/* Inline script for copy-to-clipboard (no client component needed) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('click', function(e) {
              var btn = e.target.closest('[data-copy-text]');
              if (!btn) return;
              var text = btn.getAttribute('data-copy-text');
              navigator.clipboard.writeText(text).then(function() {
                var icon = btn.querySelector('svg');
                if (icon) {
                  var original = btn.innerHTML;
                  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                  setTimeout(function() { btn.innerHTML = original; }, 1500);
                }
              });
            });
          `,
        }}
      />
    </div>
  );
}
