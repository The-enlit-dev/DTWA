import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import Link from 'next/link';
import {
  Youtube,
  ArrowRight,
  Zap,
  Users,
  BookOpen,
  Newspaper,
  Target,
  Telescope,
  Heart,
  Lightbulb,
  Globe,
  Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'About',
  description:
    'The story behind Decoding Tomorrow With Attharva — why it was built, the mission driving it, and the vision for where it is going.',
  openGraph: {
    title: 'About | Decoding Tomorrow With Attharva',
    description:
      'The story behind Decoding Tomorrow With Attharva — clear thinking, honest analysis, zero hype.',
    type: 'profile',
    images: [{ url: '/my_good_picture_for_pfp.png', alt: 'Attharva — Decoding Tomorrow' }],
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/about' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Attharva',
  url: 'https://decodingtomorrowwithattharva.netlify.app',
  image: 'https://decodingtomorrowwithattharva.netlify.app/my_good_picture_for_pfp.png',
  description: "Creator of Decoding Tomorrow — India's AI media platform covering AI tools, companies, and the future of technology.",
  sameAs: ['https://www.youtube.com/@DecodingTomorrowWithAttharva'],
};

async function getStats() {
  const [profilesRes, articlesRes, subscribersRes, toolsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
    supabase.from('ai_tools').select('id', { count: 'exact', head: true }),
  ]);

  return {
    members: profilesRes.count ?? 0,
    articles: articlesRes.count ?? 0,
    subscribers: subscribersRes.count ?? 0,
    tools: toolsRes.count ?? 0,
  };
}

export default async function AboutPage() {
  const stats = await getStats();

  const statItems = [
    { icon: Users, value: stats.members.toLocaleString(), label: 'Community Members' },
    { icon: BookOpen, value: stats.articles.toLocaleString(), label: 'Published Articles' },
    { icon: Newspaper, value: stats.subscribers.toLocaleString(), label: 'Newsletter Readers' },
    { icon: Star, value: stats.tools.toLocaleString(), label: 'AI Tools Reviewed' },
  ];

  const values = [
    {
      icon: Target,
      title: 'Clarity Over Complexity',
      description:
        "AI is hard enough without jargon. Every piece of content is written for someone smart who just hasn't gone deep on this topic yet.",
    },
    {
      icon: Heart,
      title: 'Honest, Not Hype',
      description:
        "No sponsored takes disguised as opinions. If a tool is overhyped, I'll say so. If something is genuinely transformative, I'll tell you why.",
    },
    {
      icon: Lightbulb,
      title: 'Insight, Not Just Information',
      description:
        "Anyone can aggregate AI news. The goal here is to help you understand what it actually means for you — your career, your business, your life.",
    },
    {
      icon: Globe,
      title: 'Built for India & Beyond',
      description:
        "Most AI media is US-centric. Decoding Tomorrow covers the global AI landscape with a lens that's relevant to Indian builders, students, and professionals.",
    },
  ];

  const timeline = [
    {
      year: 'The Beginning',
      title: "A Question That Wouldn't Go Away",
      description:
        "Attharva started asking a simple question: \"Why is it so hard to find good, honest AI coverage in India?\" Most content was either too technical, too hyped, or just repurposed Twitter threads. There was a gap — and a chance to fill it.",
    },
    {
      year: 'The Channel',
      title: 'YouTube: Going Deep',
      description:
        'The YouTube channel launched with one goal: make videos that actually teach you something. Not listicles — real analysis of AI models, company strategies, and tech trends that matter.',
    },
    {
      year: 'The Platform',
      title: 'Building Decoding Tomorrow',
      description:
        'As the community grew, so did the ambition. Decoding Tomorrow became a full media platform — a place to read long-form articles, discover AI tools, follow companies, and get a weekly newsletter worth reading.',
    },
    {
      year: 'The Vision',
      title: "India's AI Intelligence Layer",
      description:
        "The goal is simple but ambitious: become the go-to resource for anyone in India (and beyond) trying to understand, use, and build with AI — from students to startup founders to enterprise teams.",
    },
  ];

  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="pt-20">

        {/* Hero */}
        <div className="relative overflow-hidden py-20 border-b border-white/6">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 via-brand-purple/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              India&rsquo;s AI Media Platform
            </div>
            <Image
              src="/my_good_picture_for_pfp.png"
              alt="Attharva — Decoding Tomorrow"
              width={96}
              height={96}
              className="rounded-full mx-auto mb-8 ring-4 ring-brand-blue/20 shadow-brand"
            />
            <h1 className="font-display font-bold text-5xl sm:text-6xl text-white mb-5 leading-tight">
              Hi, I&rsquo;m <span className="gradient-text">Attharva</span>
            </h1>
            <p className="text-gray-300 text-xl leading-relaxed max-w-2xl mx-auto mb-3">
              I built Decoding Tomorrow to answer one question:
            </p>
            <p className="text-white text-xl font-semibold max-w-2xl mx-auto mb-10">
              &ldquo;What does AI actually mean for how we work, build, and live?&rdquo;
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/blog" className="btn-gradient px-6 py-3 text-white font-semibold rounded-xl flex items-center gap-2">
                Read Articles <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://www.youtube.com/@DecodingTomorrowWithAttharva"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors"
              >
                <Youtube className="w-5 h-5" /> Watch on YouTube
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="border-b border-white/6 bg-brand-950/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {statItems.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-5 h-5 text-brand-blue" />
                  </div>
                  <div className="font-display font-black text-3xl gradient-text mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Story timeline */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-brand-orange" />
              <h2 className="font-display font-bold text-3xl text-white">The Story</h2>
            </div>
            <p className="text-gray-400 max-w-xl mx-auto">Every platform has an origin story. Here&rsquo;s ours.</p>
          </div>

          <div className="relative pl-8 border-l border-white/10 space-y-10">
            {timeline.map((item, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[2.15rem] w-3.5 h-3.5 rounded-full bg-brand-blue border-2 border-brand-900 mt-1" />
                <div className="glass rounded-xl p-6 border border-white/8 hover:border-white/15 transition-all">
                  <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider mb-2">{item.year}</div>
                  <h3 className="font-display font-bold text-lg text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="border-t border-white/6 bg-brand-950/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-brand-orange" />
                <h2 className="font-display font-bold text-3xl text-white">What We Stand For</h2>
              </div>
              <p className="text-gray-400 max-w-xl mx-auto">
                The principles that shape every piece of content, every tool review, every newsletter issue.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {values.map((v) => (
                <div key={v.title} className="glass rounded-xl p-6 border border-white/8 hover:border-brand-blue/25 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/15 border border-brand-blue/25 flex items-center justify-center mb-4 group-hover:bg-brand-blue/20 transition-colors">
                    <v.icon className="w-5 h-5 text-brand-blue" />
                  </div>
                  <h3 className="font-display font-bold text-white text-base mb-2">{v.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vision CTA */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="gradient-border rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center mx-auto mb-6">
              <Telescope className="w-6 h-6 text-brand-orange" />
            </div>
            <h2 className="font-display font-bold text-3xl text-white mb-5">The Vision</h2>
            <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto mb-4">
              In 5 years, AI will touch every job, every industry, every country. Most people will feel left behind. A small number will understand it deeply enough to build, lead, and thrive.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
              Decoding Tomorrow&rsquo;s mission is to make sure as many people as possible — especially from India — are in that second group.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/newsletter" className="btn-gradient px-8 py-3.5 text-white font-semibold rounded-xl flex items-center gap-2">
                Join the Community <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/blog" className="px-8 py-3.5 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl font-medium transition-all">
                Start Reading
              </Link>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
