'use client';

import { MessageCircle, ArrowRight, Sparkles, Wrench, HelpCircle, Rocket, Briefcase, Newspaper } from 'lucide-react';
import { useCommunitySettings, useCommunityClick } from '@/lib/community';

const benefits = [
  {
    icon: Sparkles,
    title: 'Learn AI',
    desc: 'From beginner concepts to advanced techniques — our community breaks down complex AI topics into digestible insights.',
    color: 'text-brand-blue bg-brand-blue/10 border-brand-blue/20',
  },
  {
    icon: Wrench,
    title: 'Discover AI Tools',
    desc: 'Find the best AI tools for your workflow. Members share real-world reviews, tips, and comparisons you won\'t find anywhere else.',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  },
  {
    icon: HelpCircle,
    title: 'Ask Questions',
    desc: 'Stuck on a concept or project? Get answers from a community of AI enthusiasts, builders, and experts.',
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
  {
    icon: Rocket,
    title: 'Share Projects',
    desc: 'Show off what you\'re building, get feedback, and find collaborators for your next AI-powered venture.',
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  },
  {
    icon: Briefcase,
    title: 'Career Discussions',
    desc: 'Navigate the AI job market with advice on roles, skills, portfolios, and interviews from people who\'ve been there.',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  },
  {
    icon: Newspaper,
    title: 'Stay Updated on AI News',
    desc: 'Never miss a breakthrough. Members share and discuss the latest AI news, research papers, and industry moves in real time.',
    color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  },
];

export default function CommunityClient() {
  const { settings, loading } = useCommunitySettings();
  const trackClick = useCommunityClick();

  const handleDiscordClick = () => trackClick('discord', 'community_page');
  const handleRedditClick = () => trackClick('reddit', 'community_page');

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
            <MessageCircle className="w-3.5 h-3.5 text-brand-blue" />
            <span className="text-xs font-medium text-gray-300">Join 1,000+ AI enthusiasts</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            The <span className="gradient-text">Decoding Tomorrow</span> Community
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10">
            Where curious minds come to learn, build, and discuss the future of AI. Whether you're
            just starting out or shipping production models, there's a place for you here. Connect
            with fellow builders, stay ahead of the curve, and grow together.
          </p>

          {/* Join buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={settings.discord_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDiscordClick}
              className="group flex items-center gap-3 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-2xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#5865F2]/30 w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Join Discord
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={settings.reddit_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleRedditClick}
              className="group flex items-center gap-3 px-8 py-4 bg-[#FF4500] hover:bg-[#E03D00] text-white font-semibold rounded-2xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF4500]/30 w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.197-.547-.66 3.005c1.555.07 2.956.547 3.934 1.27.4-.333.913-.535 1.473-.535 1.27 0 2.298 1.029 2.298 2.298 0 .89-.508 1.66-1.252 2.045-.034.145-.052.294-.052.448 0 2.236-2.626 4.05-5.866 4.05s-5.866-1.814-5.866-4.05c0-.154-.018-.303-.052-.448-.744-.385-1.252-1.155-1.252-2.045 0-1.27 1.028-2.298 2.298-2.298.56 0 1.073.202 1.473.535.978-.723 2.379-1.2 3.934-1.27l.743-3.395a.249.249 0 0 1 .27-.19l2.413.601c.226-.466.7-.786 1.25-.786zM8.5 11.5c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm7 0c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm-3.5 6.5c-1.105 0-2 .895-2 2 0 1.105.895 2 2 2s2-.895 2-2c0-1.105-.895-2-2-2z" />
              </svg>
              Join Reddit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
          {!loading && (
            <p className="text-xs text-gray-600 mt-6">
              Free to join · No experience required · Cancel anytime
            </p>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section>
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
            Why Join the Community?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Six reasons thousands of builders, learners, and professionals call Decoding Tomorrow their AI home.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="glass rounded-2xl p-6 border border-white/8 hover:border-white/18 transition-all hover:-translate-y-1 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${benefit.color} mb-4 group-hover:scale-110 transition-transform`}>
                <benefit.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="glass rounded-3xl p-10 sm:p-14 border border-white/8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/5 via-transparent to-[#FF4500]/5 pointer-events-none" />
        <div className="relative">
          <h2 className="font-display font-bold text-3xl text-white mb-4">
            Ready to dive in?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Pick your platform and start connecting with the community today. We'll see you there.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={settings.discord_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDiscordClick}
              className="flex items-center gap-2.5 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-xl transition-all hover:scale-[1.02] w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Join Discord
            </a>
            <a
              href={settings.reddit_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleRedditClick}
              className="flex items-center gap-2.5 px-6 py-3 bg-[#FF4500] hover:bg-[#E03D00] text-white font-semibold rounded-xl transition-all hover:scale-[1.02] w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.197-.547-.66 3.005c1.555.07 2.956.547 3.934 1.27.4-.333.913-.535 1.473-.535 1.27 0 2.298 1.029 2.298 2.298 0 .89-.508 1.66-1.252 2.045-.034.145-.052.294-.052.448 0 2.236-2.626 4.05-5.866 4.05s-5.866-1.814-5.866-4.05c0-.154-.018-.303-.052-.448-.744-.385-1.252-1.155-1.252-2.045 0-1.27 1.028-2.298 2.298-2.298.56 0 1.073.202 1.473.535.978-.723 2.379-1.2 3.934-1.27l.743-3.395a.249.249 0 0 1 .27-.19l2.413.601c.226-.466.7-.786 1.25-.786zM8.5 11.5c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm7 0c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm-3.5 6.5c-1.105 0-2 .895-2 2 0 1.105.895 2 2 2s2-.895 2-2c0-1.105-.895-2-2-2z" />
              </svg>
              Join Reddit
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
