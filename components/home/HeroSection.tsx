import Link from 'next/link';
import { ArrowRight, Zap, TrendingUp, Youtube } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full orb-blue opacity-30 blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full orb-purple opacity-25 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 rounded-full orb-pink opacity-20 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />

        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(74,108,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,108,247,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 border border-brand-blue/30">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">India's #1 AI Media Platform</span>
            <Zap className="w-3.5 h-3.5 text-brand-blue" />
          </div>

          {/* Headline */}
          <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.1] mb-6">
            Decoding the Future of{' '}
            <span className="gradient-text">AI, Business</span>
            <br />
            <span className="text-white">&amp; Technology</span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Deep dives on AI tools, company analysis, and the trends shaping tomorrow — explained simply. Think School meets TechCrunch.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              href="/blog"
              className="btn-gradient flex items-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl text-base"
            >
              Start Reading <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://www.youtube.com/@DecodingTomorrowWithAttharva"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl text-base glass border border-white/10 hover:border-white/20 transition-all hover:bg-white/5"
            >
              <Youtube className="w-5 h-5 text-red-500" />
              Watch on YouTube
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-40">
          <div className="w-px h-8 bg-gradient-to-b from-brand-blue to-transparent" />
          <TrendingUp className="w-4 h-4 text-brand-blue" />
        </div>
      </div>
    </section>
  );
}
