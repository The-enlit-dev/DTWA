import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { SkillNode, Badge, SkillQuizQuestion } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { SkillsClient } from './SkillsClient';
import { Target, Award } from 'lucide-react';

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'AI Skill Tree — Level Up Your AI Knowledge',
  description:
    'Gamified AI learning path. Earn XP, unlock badges, and track your progress across 8 skill categories from AI Basics to Fine-Tuning.',
  keywords: ['AI skills', 'AI learning', 'prompt engineering', 'RAG', 'AI agents', 'skill tree', 'gamified learning'],
  openGraph: {
    title: 'AI Skill Tree | Decoding Tomorrow',
    description: 'Level up your AI skills. 8 categories, XP, badges, and progress tracking.',
    type: 'website',
    url: `${SITE_URL}/skills`,
  },
  alternates: { canonical: `${SITE_URL}/skills` },
};

async function getData() {
  const [nodesRes, badgesRes, quizRes] = await Promise.all([
    supabase.from('skill_nodes').select('*').order('order', { ascending: true }),
    supabase.from('badges').select('*'),
    supabase.from('skill_quiz_questions').select('*'),
  ]);
  return {
    nodes: (nodesRes.data || []) as SkillNode[],
    badges: (badgesRes.data || []) as Badge[],
    quizQuestions: (quizRes.data || []) as SkillQuizQuestion[],
  };
}

export default async function SkillsPage() {
  const { nodes, badges, quizQuestions } = await getData();

  // Group nodes by category
  const categories = nodes.reduce((acc, node) => {
    if (!acc[node.category]) acc[node.category] = [];
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, SkillNode[]>);

  const categoryEmojis: Record<string, string> = {
    'AI Basics': '🧠',
    'Prompt Engineering': '⌨️',
    'LLMs': '🤖',
    'RAG': '📚',
    'AI Agents': '🦾',
    'Automation': '⚙️',
    'Fine-Tuning': '🔧',
    'AI Business': '💼',
  };

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Skill Tree</span>
            </div>
            <h1 className="font-display font-bold text-4xl text-white mb-3">AI Skill Tree</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Level up from AI basics to advanced agents. Earn XP, unlock badges, and track your progress across 8 categories.
            </p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <SkillsClient nodes={nodes} categories={categories} badges={badges} categoryEmojis={categoryEmojis} quizQuestions={quizQuestions} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
