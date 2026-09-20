import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Gamepad2, Trophy, FolderGit2, Target, Rocket, Lightbulb, BarChart3, ArrowRight } from 'lucide-react';

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'Play — Interactive AI Platform',
  description:
    'Build, compete, and learn. Play the AI Startup Simulator, forecast the future in the Prediction Market, showcase projects, level up your skills, and climb the leaderboards.',
  keywords: ['AI games', 'AI simulator', 'prediction market', 'AI challenges', 'AI skills', 'gamification'],
  openGraph: {
    title: 'Play | Decoding Tomorrow With Attharva',
    description: 'Build, compete, and learn — simulator, predictions, projects, skills, and challenges.',
    type: 'website',
    url: `${SITE_URL}/play`,
  },
  alternates: { canonical: `${SITE_URL}/play` },
};

const FEATURES = [
  { title: 'AI Startup Simulator', href: '/simulator', icon: Gamepad2, desc: 'Build a virtual AI company. Make funding, hiring, and product decisions. Compete on the leaderboard.', color: 'from-blue-500/20 to-purple-500/20', border: 'border-blue-500/30' },
  { title: 'Future Prediction Market', href: '/predictions', icon: Trophy, desc: 'Forecast AGI timelines, valuations, and AI industry outcomes. Vote and build your accuracy score.', color: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30' },
  { title: 'Build in Public Hub', href: '/projects', icon: FolderGit2, desc: 'Showcase your AI projects. Get upvotes, feedback, and discover what the community is building.', color: 'from-green-500/20 to-teal-500/20', border: 'border-green-500/30' },
  { title: 'AI Skill Tree', href: '/skills', icon: Target, desc: 'Level up from AI basics to advanced agents. Earn XP, unlock badges, and track your progress.', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
  { title: 'Weekly Challenges', href: '/challenges', icon: Rocket, desc: 'Compete in build, design, and launch challenges. Submit your work, vote, and earn XP rewards.', color: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30' },
  { title: 'Business Ideas Vault', href: '/ideas', icon: Lightbulb, desc: 'Browse curated AI startup ideas with market sizes, monetization models, and difficulty ratings.', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
  { title: 'Leaderboards', href: '/leaderboard', icon: BarChart3, desc: 'See the top players, builders, and predictors. Climb the ranks and earn your spot.', color: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/30' },
];

export default function PlayPage() {
  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <div className="bg-brand-800/50 border-b border-white/6 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
              <span className="gradient-text">Play. Build. Compete.</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Decoding Tomorrow isn&apos;t just content — it&apos;s an interactive platform. Simulate startups, predict the future, level up your skills, and climb the leaderboards.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className={`group relative glass-hover rounded-2xl p-6 border ${f.border} bg-gradient-to-br ${f.color} overflow-hidden`}
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-white mb-2">{f.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">{f.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm text-brand-blue group-hover:text-blue-300 transition-colors">
                    Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
