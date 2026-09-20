'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  Compass,
  Code,
  Briefcase,
  PenTool,
  PenLine,
  Calculator,
  Microscope,
  Wrench,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

// ============================================
// INTEREST OPTIONS
// ============================================
const interests = [
  { key: 'coding', label: 'Coding', icon: Code },
  { key: 'business', label: 'Business', icon: Briefcase },
  { key: 'design', label: 'Design', icon: PenTool },
  { key: 'writing', label: 'Writing', icon: PenLine },
  { key: 'math', label: 'Mathematics', icon: Calculator },
  { key: 'research', label: 'Research', icon: Microscope },
  { key: 'building', label: 'Building things', icon: Wrench },
];

// ============================================
// CAREER DEFINITIONS
// ============================================
interface Career {
  title: string;
  whatTheyDo: string;
  keySkills: string[];
  whereToStart: string;
  startLink: string;
}

const allCareers: Record<string, Career> = {
  'Software Engineer': {
    title: 'Software Engineer',
    whatTheyDo: 'Builds the applications and systems that power AI products, writing clean, scalable code.',
    keySkills: ['Programming', 'System Design', 'Version Control', 'Testing'],
    whereToStart: 'Learn programming fundamentals and build small projects.',
    startLink: '/learn',
  },
  'AI Engineer': {
    title: 'AI Engineer',
    whatTheyDo: 'Designs and deploys AI models into production systems, bridging research and real-world applications.',
    keySkills: ['Python', 'ML Frameworks', 'MLOps', 'API Design'],
    whereToStart: 'Explore AI tools and understand how models are deployed.',
    startLink: '/tools',
  },
  'Data Scientist': {
    title: 'Data Scientist',
    whatTheyDo: 'Analyzes data to uncover insights and builds predictive models that drive business decisions.',
    keySkills: ['Statistics', 'Python', 'Data Visualization', 'SQL'],
    whereToStart: 'Understand key data and ML concepts in our glossary.',
    startLink: '/glossary',
  },
  'Robotics Engineer': {
    title: 'Robotics Engineer',
    whatTheyDo: 'Combines hardware, software, and AI to create machines that perceive and interact with the physical world.',
    keySkills: ['C++', 'Control Systems', 'Computer Vision', 'Embedded'],
    whereToStart: 'Learn the AI concepts that power perception and control.',
    startLink: '/glossary',
  },
  'Product Manager': {
    title: 'Product Manager',
    whatTheyDo: 'Defines what to build and why, balancing user needs, business goals, and technical constraints.',
    keySkills: ['Strategy', 'Communication', 'Analytics', 'User Research'],
    whereToStart: 'Understand the AI landscape and what tools exist.',
    startLink: '/tools',
  },
  'AI Product Builder': {
    title: 'AI Product Builder',
    whatTheyDo: 'Rapidly prototypes and ships AI-powered products, combining design, code, and model integration.',
    keySkills: ['Prototyping', 'Prompt Engineering', 'UX', 'Shipping'],
    whereToStart: 'Try our AI tools and experiment with building.',
    startLink: '/tools',
  },
  'Tech Entrepreneur': {
    title: 'Tech Entrepreneur',
    whatTheyDo: 'Identifies problems, builds solutions, and creates new ventures in the AI space from the ground up.',
    keySkills: ['Vision', 'Fundraising', 'Leadership', 'Resilience'],
    whereToStart: 'Browse business ideas and learn AI fundamentals.',
    startLink: '/learn',
  },
  'UX Designer': {
    title: 'UX Designer',
    whatTheyDo: 'Crafts intuitive, human-centered experiences for AI products, making complex tech feel simple.',
    keySkills: ['User Research', 'Prototyping', 'Visual Design', 'Empathy'],
    whereToStart: 'Explore AI tools to see how design shapes the experience.',
    startLink: '/tools',
  },
  'AI Interaction Designer': {
    title: 'AI Interaction Designer',
    whatTheyDo: 'Designs how humans converse and collaborate with AI systems, from chatbots to copilots.',
    keySkills: ['Conversation Design', 'Prompting', 'User Testing', 'Psychology'],
    whereToStart: 'Experiment with AI tools and prompt engineering.',
    startLink: '/tools',
  },
  'Technical Writer': {
    title: 'Technical Writer',
    whatTheyDo: 'Translates complex AI concepts into clear documentation, tutorials, and guides that anyone can follow.',
    keySkills: ['Writing', 'Research', 'Simplification', 'Tools'],
    whereToStart: 'Read our glossary and blog to see tech writing in action.',
    startLink: '/glossary',
  },
  'AI Content Strategist': {
    title: 'AI Content Strategist',
    whatTheyDo: 'Plans and creates content strategies that leverage AI tools for scaling quality content production.',
    keySkills: ['Content Strategy', 'SEO', 'AI Tools', 'Editing'],
    whereToStart: 'Explore AI tools and read our blog for strategies.',
    startLink: '/blog',
  },
  'ML Researcher': {
    title: 'ML Researcher',
    whatTheyDo: 'Advances the frontier of machine learning through experiments, papers, and novel model architectures.',
    keySkills: ['Math', 'Python', 'Papers', 'Experimentation'],
    whereToStart: 'Deepen your understanding with our glossary and articles.',
    startLink: '/glossary',
  },
  'Quantitative Analyst': {
    title: 'Quantitative Analyst',
    whatTheyDo: 'Uses mathematical models and data to analyze financial markets and inform trading strategies.',
    keySkills: ['Statistics', 'Finance', 'Python', 'Modeling'],
    whereToStart: 'Build a strong math and data foundation.',
    startLink: '/learn',
  },
  'AI Researcher': {
    title: 'AI Researcher',
    whatTheyDo: 'Explores fundamental questions in AI — from reasoning to safety — pushing what machines can do.',
    keySkills: ['Research', 'Math', 'Deep Learning', 'Writing'],
    whereToStart: 'Master the fundamentals and read cutting-edge articles.',
    startLink: '/glossary',
  },
};

// ============================================
// INTEREST → CAREER MAPPING
// ============================================
const interestToCareers: Record<string, string[]> = {
  coding: ['Software Engineer', 'AI Engineer', 'Data Scientist', 'Robotics Engineer'],
  business: ['Product Manager', 'AI Product Builder', 'Tech Entrepreneur'],
  design: ['UX Designer', 'AI Interaction Designer'],
  writing: ['Technical Writer', 'AI Content Strategist'],
  math: ['Data Scientist', 'ML Researcher', 'Quantitative Analyst'],
  research: ['AI Researcher', 'ML Researcher', 'Data Scientist'],
  building: ['AI Engineer', 'Robotics Engineer', 'AI Product Builder'],
};

export default function CareersPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const visibleCareers: Career[] = showAll
    ? Object.values(allCareers)
    : selected
      ? (interestToCareers[selected] || [])
          .map((title) => allCareers[title])
          .filter(Boolean)
      : [];

  const handleSelect = (key: string) => {
    setShowAll(false);
    setSelected(selected === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-brand-800/50 border-b border-white/6 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center">
                <Compass className="w-6 h-6 text-brand-purple" />
              </div>
              <div>
                <h1 className="font-display font-bold text-4xl text-white">Explore AI Careers</h1>
              </div>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl">
              Discover which AI career fits your interests and strengths. Pick what you enjoy,
              and we&apos;ll show you paths that could be a great match.
            </p>
          </div>
        </section>

        {/* Interactive question */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="glass rounded-2xl p-6 sm:p-8 mb-8">
            <h2 className="font-display font-semibold text-xl text-white mb-1">
              What do you enjoy?
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              Pick one or more to see relevant careers.
            </p>
            <div className="flex flex-wrap gap-3">
              {interests.map((interest) => {
                const Icon = interest.icon;
                const isActive = selected === interest.key;
                return (
                  <button
                    key={interest.key}
                    onClick={() => handleSelect(interest.key)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      isActive
                        ? 'bg-brand-blue/15 text-brand-blue border-brand-blue/40 shadow-lg shadow-brand-blue/10'
                        : 'glass border-white/8 text-gray-300 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {interest.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowAll(true);
                  setSelected(null);
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm transition-all ${
                  showAll
                    ? 'btn-gradient'
                    : 'glass border-white/8 text-gray-300 hover:text-white hover:border-white/20'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Not sure? Explore all careers
              </button>
            </div>
          </div>

          {/* Career cards */}
          {visibleCareers.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-semibold text-lg text-white">
                  {showAll
                    ? 'All AI Careers'
                    : `Careers for ${interests.find((i) => i.key === selected)?.label}`}
                </h3>
                <span className="text-sm text-gray-500">{visibleCareers.length} careers</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleCareers.map((career) => (
                  <div
                    key={career.title}
                    className="glass glass-hover rounded-2xl p-6 flex flex-col"
                  >
                    <h4 className="font-display font-bold text-base text-white mb-3">
                      {career.title}
                    </h4>

                    {/* What they do */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        What they do
                      </p>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {career.whatTheyDo}
                      </p>
                    </div>

                    {/* Key skills */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Key skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {career.keySkills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-gray-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Where to start */}
                    <div className="mt-auto pt-4 border-t border-white/6">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Where to start
                      </p>
                      <p className="text-gray-400 text-sm mb-2">{career.whereToStart}</p>
                      <Link
                        href={career.startLink}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-blue hover:gap-2.5 transition-all"
                      >
                        Get started
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : !showAll && !selected ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/8 mb-5">
                <Compass className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">
                Pick an interest above
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Choose what you enjoy doing, or explore all careers to see everything at once.
              </p>
            </div>
          ) : null}

          {/* Disclaimer */}
          <div className="mt-10 glass rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            <p className="text-gray-500 text-sm leading-relaxed">
              <span className="font-semibold text-gray-400">Disclaimer:</span>{' '}
              This is educational guidance, not a guarantee of employment. Career paths vary
              widely based on your location, experience, education, and the evolving job market.
              Use this as a starting point for your own exploration.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
