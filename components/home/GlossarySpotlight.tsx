import Link from 'next/link';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';

const categoryColors: Record<string, string> = {
  'Foundations': 'text-blue-400 bg-blue-400/10',
  'Models': 'text-green-400 bg-green-400/10',
  'Architecture': 'text-orange-400 bg-orange-400/10',
  'Training': 'text-yellow-400 bg-yellow-400/10',
  'Usage': 'text-brand-blue bg-brand-blue/10',
  'Infrastructure': 'text-pink-400 bg-pink-400/10',
  'Ethics & Safety': 'text-rose-400 bg-rose-400/10',
  'Ecosystem': 'text-cyan-400 bg-cyan-400/10',
};

interface Term {
  id: string;
  term: string;
  slug: string;
  simple_explanation: string;
  category: string;
}

export default function GlossarySpotlight({ terms }: { terms: Term[] }) {
  if (!terms.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-blue/15 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-brand-blue" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white">Popular AI Glossary Terms</h2>
            <p className="text-xs text-gray-500 mt-0.5">Core concepts explained simply</p>
          </div>
        </div>
        <Link
          href="/glossary"
          className="hidden sm:flex items-center gap-1.5 text-sm text-brand-blue hover:text-blue-300 transition-colors"
        >
          Full glossary <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {terms.map((term) => {
          const colorClass = categoryColors[term.category] || 'text-gray-400 bg-white/5';
          return (
            <Link
              key={term.id}
              href={`/glossary/${term.slug}`}
              className="group glass rounded-xl p-4 border border-white/8 hover:border-brand-blue/25 hover:-translate-y-0.5 transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
                  {term.category}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-brand-blue group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="font-display font-bold text-sm text-white group-hover:text-brand-blue transition-colors leading-snug">
                {term.term}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                {term.simple_explanation}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 text-center sm:hidden">
        <Link href="/glossary" className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:text-blue-300 transition-colors">
          Browse all terms <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
