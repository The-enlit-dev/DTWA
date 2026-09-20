import Link from 'next/link';
import Image from 'next/image';
import { Youtube, ArrowRight, Users, BookOpen, Newspaper, Zap, Star, Target } from 'lucide-react';

const credibilityItems = [
  { icon: Youtube, label: 'YouTube Creator', value: 'AI & Business', color: 'text-red-400' },
  { icon: Users, label: 'Community', value: '10,000+ Readers', color: 'text-green-400' },
  { icon: BookOpen, label: 'AI Glossary', value: '50+ Terms', color: 'text-brand-blue' },
  { icon: Zap, label: 'Tools Reviewed', value: '100+ AI Tools', color: 'text-yellow-400' },
];

export default function FounderSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-800/80 via-brand-800/60 to-brand-blue/10 rounded-2xl" />
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-brand-blue/8 blur-3xl pointer-events-none" />

      <div className="relative grid lg:grid-cols-5 gap-8 p-6 sm:p-8 lg:p-10 border border-white/8 rounded-2xl">

        {/* Photo + name — 2 cols */}
        <div className="lg:col-span-2 flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-start gap-6">
          <div className="relative shrink-0">
            <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-2xl overflow-hidden border-2 border-brand-blue/30 shadow-lg shadow-brand-blue/10">
              <Image
                src="/my_good_picture_for_pfp.png"
                alt="Attharva — Decoding Tomorrow"
                width={144}
                height={144}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-2 border-brand-900 flex items-center justify-center">
              <span className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-blue/15 rounded-full text-xs text-brand-blue font-medium mb-2">
              <Star className="w-3 h-3 fill-brand-blue" /> India's AI Media
            </div>
            <h2 className="font-display font-bold text-2xl text-white leading-tight">Attharva</h2>
            <p className="text-gray-400 text-sm mt-0.5">Founder, Decoding Tomorrow</p>
            <div className="flex items-center gap-2 mt-3">
              <a
                href="https://www.youtube.com/@DecodingTomorrowWithAttharva"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 border border-red-500/25 rounded-lg text-xs text-red-400 hover:bg-red-500/25 transition-colors"
              >
                <Youtube className="w-3.5 h-3.5" /> YouTube
              </a>
              <Link
                href="/about"
                className="flex items-center gap-1.5 px-3 py-1.5 glass border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors"
              >
                Full Story <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Content — 3 cols */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-brand-blue" />
              <p className="text-xs font-semibold text-brand-blue uppercase tracking-wider">The Mission</p>
            </div>
            <p className="text-gray-300 text-base leading-relaxed">
              AI is moving fast — too fast for most people to keep up. Decoding Tomorrow exists to bridge that gap:
              giving you clear, honest, jargon-free analysis of AI tools, companies, and trends that actually matter.
              Think School meets TechCrunch, built for India's next generation of builders.
            </p>
          </div>

          {/* Credibility grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {credibilityItems.map((item) => (
              <div key={item.label} className="glass rounded-xl p-3 border border-white/6 text-center">
                <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1.5`} />
                <p className="text-white font-bold text-sm">{item.value}</p>
                <p className="text-gray-600 text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
