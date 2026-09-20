'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Cpu, CheckCircle, ExternalLink, RotateCcw } from 'lucide-react';

type Step = 0 | 1 | 2;

const questions = [
  {
    id: 'role',
    question: 'Who are you?',
    subtitle: 'Help us understand your background so we can tailor recommendations.',
    options: [
      { value: 'student', label: 'Student / Learner', emoji: '🎓', description: 'Still learning, building side projects' },
      { value: 'creator', label: 'Content Creator', emoji: '✍️', description: 'Writer, marketer, YouTuber, designer' },
      { value: 'developer', label: 'Developer / Engineer', emoji: '💻', description: 'Building products and automating workflows' },
      { value: 'entrepreneur', label: 'Entrepreneur / Founder', emoji: '🚀', description: 'Running or building a business' },
      { value: 'professional', label: 'Business Professional', emoji: '💼', description: 'Analyst, manager, consultant, researcher' },
    ],
  },
  {
    id: 'budget',
    question: 'What is your monthly budget for AI tools?',
    subtitle: "Be honest — this helps us filter out tools that won't fit.",
    options: [
      { value: 'free', label: 'Free only', emoji: '🆓', description: "I'd prefer not to pay anything right now" },
      { value: 'low', label: 'Under ₹1,000 / $15', emoji: '💰', description: 'Happy to pay for the right tool' },
      { value: 'mid', label: '₹1,000 – ₹5,000 / $15–$60', emoji: '💳', description: 'Willing to invest in productivity' },
      { value: 'high', label: 'Above ₹5,000 / $60+', emoji: '🏆', description: "Budget isn't a constraint for the right tool" },
    ],
  },
  {
    id: 'usecase',
    question: 'What do you mainly want to do with AI?',
    subtitle: 'Pick the use case that matters most to you right now.',
    options: [
      { value: 'writing', label: 'Write & Create Content', emoji: '✍️', description: 'Blogs, scripts, emails, social posts' },
      { value: 'coding', label: 'Code & Build', emoji: '💻', description: 'Autocomplete, debugging, prototypes' },
      { value: 'research', label: 'Research & Summarize', emoji: '🔍', description: 'Analyze documents, web search, notes' },
      { value: 'image', label: 'Generate Images & Design', emoji: '🎨', description: 'Visuals, thumbnails, art' },
      { value: 'productivity', label: 'Automate & Manage Tasks', emoji: '⚡', description: 'Workflows, scheduling, email management' },
      { value: 'chat', label: 'Chat & Q&A Assistant', emoji: '🤖', description: 'General assistant for daily questions' },
    ],
  },
];

interface Recommendation {
  name: string;
  description: string;
  pricing: string;
  link: string;
  tags: string[];
  why: string;
}

function getRecommendations(role: string, budget: string, usecase: string): Recommendation[] {
  const all: Record<string, Recommendation[]> = {
    'writing-free': [
      { name: 'ChatGPT (Free)', description: 'Versatile AI assistant for writing, brainstorming, and editing.', pricing: 'Free', link: 'https://chat.openai.com', tags: ['Writing', 'General AI'], why: 'The most popular AI writer with a solid free tier — perfect to start with.' },
      { name: 'Notion AI', description: 'AI built directly into your note-taking workspace.', pricing: 'Freemium', link: 'https://notion.so', tags: ['Writing', 'Productivity'], why: 'If you already use Notion, the AI integration is seamless for drafting and editing.' },
    ],
    'writing-low': [
      { name: 'Claude (Anthropic)', description: 'Long-form writing and nuanced content at exceptional quality.', pricing: '$20/mo', link: 'https://claude.ai', tags: ['Writing', 'Research'], why: 'Best for long-form content — handles context beautifully, great for creators.' },
    ],
    'writing-mid': [
      { name: 'Claude Pro', description: 'Priority access to Claude — the best long-form AI writer.', pricing: '$20/mo', link: 'https://claude.ai', tags: ['Writing', 'Research'], why: 'Unmatched for long documents, nuanced tone, and in-depth articles.' },
      { name: 'Copy.ai', description: 'AI content workflows and automation for marketing teams.', pricing: 'From $49/mo', link: 'https://copy.ai', tags: ['Marketing', 'Writing'], why: 'Powerful workflows to automate your entire content pipeline.' },
    ],
    'writing-high': [
      { name: 'ChatGPT Team', description: 'GPT-4o with team collaboration, higher limits, and privacy.', pricing: '$30/user/mo', link: 'https://openai.com', tags: ['Writing', 'Enterprise'], why: 'Best for teams — shared workspace, higher rate limits, and data privacy.' },
    ],
    'coding-free': [
      { name: 'Codeium', description: 'Free AI code assistant that works across 70+ languages.', pricing: 'Free', link: 'https://codeium.com', tags: ['Coding', 'Free'], why: 'Completely free with surprisingly strong autocomplete performance.' },
      { name: 'GitHub Copilot (Free tier)', description: 'AI code completion integrated directly in VS Code.', pricing: 'Free for students', link: 'https://github.com/features/copilot', tags: ['Coding', 'Autocomplete'], why: 'The standard for AI coding — free for students and open source maintainers.' },
    ],
    'coding-low': [
      { name: 'GitHub Copilot', description: 'Industry-standard AI pair programmer built by OpenAI + GitHub.', pricing: '$10/mo', link: 'https://github.com/features/copilot', tags: ['Coding', 'VS Code'], why: 'The most widely used coding AI — deeply integrated with your IDE workflow.' },
      { name: 'Cursor', description: 'AI-first code editor with multi-file editing and chat.', pricing: '$20/mo', link: 'https://cursor.sh', tags: ['Coding', 'Editor'], why: 'Cursor is what happens when AI is the editor, not a plugin. Highly recommended.' },
    ],
    'coding-mid': [
      { name: 'Cursor Pro', description: 'Full Cursor Pro plan with unlimited fast completions.', pricing: '$20/mo', link: 'https://cursor.sh', tags: ['Coding', 'Editor'], why: 'For developers who code daily, Cursor Pro pays for itself in saved hours.' },
    ],
    'coding-high': [
      { name: 'Cursor + Claude API', description: 'Cursor editor with your own Claude API key for maximum power.', pricing: '$20+/mo', link: 'https://cursor.sh', tags: ['Coding', 'Power User'], why: 'Max quality AI coding — bring your own API key for the best model access.' },
    ],
    'research-free': [
      { name: 'Perplexity AI (Free)', description: 'AI-powered search with real-time web access and citations.', pricing: 'Free', link: 'https://perplexity.ai', tags: ['Research', 'Search'], why: 'The best free AI research tool — gives you sources, not just answers.' },
      { name: 'NotebookLM', description: "Google's AI for summarizing and questioning your documents.", pricing: 'Free', link: 'https://notebooklm.google.com', tags: ['Research', 'Documents'], why: 'Upload PDFs and research papers, then chat with them. Completely free.' },
    ],
    'research-low': [
      { name: 'Perplexity Pro', description: 'Unlimited searches, access to GPT-4 and Claude models.', pricing: '$20/mo', link: 'https://perplexity.ai', tags: ['Research', 'Search'], why: 'Hands-down the best AI for web research with verified sources.' },
    ],
    'research-mid': [
      { name: 'Claude Pro', description: 'Long context window — perfect for analyzing large documents.', pricing: '$20/mo', link: 'https://claude.ai', tags: ['Research', 'Analysis'], why: '200K token context means you can dump entire reports in and get smart analysis.' },
    ],
    'research-high': [
      { name: 'Elicit', description: 'AI research assistant trained on academic papers.', pricing: '$29/mo', link: 'https://elicit.com', tags: ['Research', 'Academic'], why: 'Purpose-built for researchers — extracts data from papers at scale.' },
    ],
    'image-free': [
      { name: 'Bing Image Creator', description: 'Free DALL-E 3 image generation powered by Microsoft.', pricing: 'Free', link: 'https://bing.com/create', tags: ['Image', 'Free'], why: 'Free access to DALL-E 3 — one of the best image generators available.' },
      { name: 'Adobe Firefly (Free tier)', description: "Adobe's generative AI for images and design elements.", pricing: 'Free tier', link: 'https://firefly.adobe.com', tags: ['Image', 'Design'], why: 'Commercially safe images directly inside Adobe tools.' },
    ],
    'image-low': [
      { name: 'Midjourney Basic', description: 'The highest-quality AI image generator, loved by creators.', pricing: '$10/mo', link: 'https://midjourney.com', tags: ['Image', 'Creative'], why: 'The gold standard for artistic AI images — worth every rupee.' },
    ],
    'image-mid': [
      { name: 'Midjourney Standard', description: 'More GPU time for serious creators and designers.', pricing: '$30/mo', link: 'https://midjourney.com', tags: ['Image', 'Creative'], why: 'If you generate lots of images, the Standard plan unlocks relax mode.' },
    ],
    'image-high': [
      { name: 'Adobe Firefly Pro', description: 'Full Adobe Creative Suite with AI generation and Photoshop.', pricing: '$55+/mo', link: 'https://adobe.com', tags: ['Image', 'Design', 'Enterprise'], why: 'The complete creative AI stack — for professional designers and studios.' },
    ],
    'productivity-free': [
      { name: 'Notion AI', description: 'AI-enhanced note-taking, task management, and docs.', pricing: 'Free with Notion', link: 'https://notion.so', tags: ['Productivity', 'Notes'], why: 'If you live in Notion, the AI integration makes it dramatically more powerful.' },
      { name: 'Make (free tier)', description: 'Visual no-code automation connecting 1000+ apps.', pricing: 'Free tier', link: 'https://make.com', tags: ['Automation', 'Workflows'], why: 'Automate repetitive tasks visually — no code required.' },
    ],
    'productivity-low': [
      { name: 'Zapier', description: 'The most popular no-code automation platform.', pricing: 'From $20/mo', link: 'https://zapier.com', tags: ['Automation', 'Productivity'], why: 'Connect any app to any other — the backbone of modern productivity stacks.' },
    ],
    'productivity-mid': [
      { name: 'Zapier + ChatGPT', description: 'Automate workflows with AI-powered decision making.', pricing: '$40-60/mo', link: 'https://zapier.com', tags: ['Automation', 'AI'], why: 'Combining Zapier triggers with GPT actions unlocks incredibly powerful automations.' },
    ],
    'productivity-high': [
      { name: 'Microsoft Copilot 365', description: 'AI across Word, Excel, PowerPoint, Teams, and Outlook.', pricing: '$30/user/mo', link: 'https://microsoft.com/copilot', tags: ['Productivity', 'Enterprise'], why: 'Deep AI integration across the entire Microsoft suite — transformative for enterprises.' },
    ],
    'chat-free': [
      { name: 'ChatGPT (Free)', description: "The world's most popular AI chatbot — free to use.", pricing: 'Free', link: 'https://chat.openai.com', tags: ['Chat', 'General AI'], why: "The obvious starting point — powerful, free, and available everywhere." },
      { name: 'Gemini (Google)', description: "Google's AI assistant with web access and Google integration.", pricing: 'Free', link: 'https://gemini.google.com', tags: ['Chat', 'Google'], why: "Best if you're in the Google ecosystem — integrates with Docs, Gmail, Drive." },
    ],
    'chat-low': [
      { name: 'ChatGPT Plus', description: 'GPT-4o access, plugins, browsing, and image generation.', pricing: '$20/mo', link: 'https://chat.openai.com', tags: ['Chat', 'General AI'], why: 'The best all-round AI assistant for daily use — consistently the most capable.' },
    ],
    'chat-mid': [
      { name: 'Claude Pro + ChatGPT Plus', description: 'Best of both worlds — Claude for long documents, GPT for general tasks.', pricing: '$40/mo total', link: 'https://claude.ai', tags: ['Chat', 'Research', 'Writing'], why: 'Power users use both: Claude for analysis, GPT-4 for everything else.' },
    ],
    'chat-high': [
      { name: 'ChatGPT Team', description: 'Team workspace with higher limits, shared chats, and privacy.', pricing: '$30/user/mo', link: 'https://openai.com', tags: ['Chat', 'Enterprise'], why: 'Best for teams — shared context, better privacy, and admin controls.' },
    ],
  };

  const key = `${usecase}-${budget}`;
  return all[key] || all[`${usecase}-free`] || [];
}

export default function ToolFinderClient() {
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const current = questions[step];

  const handleSelect = (value: string) => {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (step < 2) {
      setStep((step + 1) as Step);
    } else {
      setDone(true);
    }
  };

  const reset = () => { setStep(0); setAnswers({}); setDone(false); };

  const recs = done ? getRecommendations(answers.role, answers.budget, answers.usecase) : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/25 rounded-full text-xs text-brand-blue font-semibold mb-5">
          <Cpu className="w-3.5 h-3.5" /> AI Tool Finder
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
          Find Your Perfect <span className="gradient-text">AI Tool</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Answer 3 quick questions. Get hand-picked recommendations tailored to you.
        </p>
      </div>

      {!done ? (
        <>
          <div className="flex items-center gap-2 mb-10">
            {questions.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-brand-blue' : 'bg-white/10'}`} />
            ))}
          </div>

          <div className="mb-8">
            <div className="text-xs text-brand-blue font-semibold uppercase tracking-wider mb-2">
              Question {step + 1} of {questions.length}
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2">{current.question}</h2>
            <p className="text-gray-500 text-sm">{current.subtitle}</p>
          </div>

          <div className="space-y-3">
            {current.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="w-full text-left flex items-center gap-4 p-4 glass rounded-xl border border-white/8 hover:border-brand-blue/40 hover:bg-brand-blue/5 transition-all group"
              >
                <span className="text-2xl shrink-0">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm group-hover:text-brand-blue transition-colors">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-blue transition-colors shrink-0" />
              </button>
            ))}
          </div>

          {step > 0 && (
            <button onClick={() => setStep((step - 1) as Step)} className="mt-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
        </>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
            <div>
              <h2 className="font-display font-bold text-xl text-white">Your recommendations are ready</h2>
              <p className="text-sm text-gray-500 mt-0.5">Based on your answers, here are the best AI tools for you.</p>
            </div>
          </div>

          {recs.length > 0 ? (
            <div className="space-y-4 mb-10">
              {recs.map((rec, i) => (
                <div key={i} className="glass rounded-xl p-5 border border-white/8 hover:border-brand-blue/30 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-display font-bold text-white text-base">{rec.name}</h3>
                      <p className="text-gray-400 text-sm mt-1 leading-relaxed">{rec.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                      {rec.pricing}
                    </span>
                  </div>
                  <div className="p-3 bg-brand-blue/8 border border-brand-blue/15 rounded-lg mb-4">
                    <p className="text-xs text-gray-300 leading-relaxed"><span className="text-brand-blue font-semibold">Why this? </span>{rec.why}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {rec.tags.map((tag) => (
                        <span key={tag} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <a href={rec.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-blue-300 font-medium transition-colors">
                      Try it <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-8 text-center border border-white/8 mb-10">
              <p className="text-gray-400">No specific recommendations found. Browse our full tools directory.</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/tools" className="flex-1 btn-gradient text-center py-3 text-sm font-semibold text-white rounded-xl">
              Browse All AI Tools <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <button onClick={reset} className="flex items-center justify-center gap-2 px-6 py-3 text-sm text-gray-400 border border-white/10 rounded-xl hover:text-white hover:border-white/20 transition-all">
              <RotateCcw className="w-4 h-4" /> Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
