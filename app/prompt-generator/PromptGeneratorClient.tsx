'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles, Copy, CheckCheck, RefreshCw, Share2, ArrowRight,
  Pen, Code2, Search, Mail, Lightbulb, BarChart2, MessageSquare, Cpu,
  ChevronDown,
} from 'lucide-react';

type Category = 'blog' | 'code' | 'research' | 'email' | 'brainstorm' | 'analyze' | 'social' | 'explain';
type Tone = 'professional' | 'casual' | 'technical' | 'creative' | 'concise';
type Length = 'short' | 'medium' | 'detailed';
type Format = 'paragraph' | 'bullets' | 'step-by-step' | 'table';

const CATEGORIES: { id: Category; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'blog', label: 'Blog / Article', icon: Pen, description: 'Content writing' },
  { id: 'code', label: 'Code / Dev', icon: Code2, description: 'Programming tasks' },
  { id: 'research', label: 'Research', icon: Search, description: 'Deep analysis' },
  { id: 'email', label: 'Email / Comms', icon: Mail, description: 'Professional writing' },
  { id: 'brainstorm', label: 'Brainstorm', icon: Lightbulb, description: 'Generate ideas' },
  { id: 'analyze', label: 'Data & Analysis', icon: BarChart2, description: 'Insight extraction' },
  { id: 'social', label: 'Social Media', icon: MessageSquare, description: 'Posts & captions' },
  { id: 'explain', label: 'Explain / Teach', icon: Cpu, description: 'Simplify complex topics' },
];

const TONES: { id: Tone; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual & Friendly' },
  { id: 'technical', label: 'Technical & Precise' },
  { id: 'creative', label: 'Creative & Bold' },
  { id: 'concise', label: 'Concise & Direct' },
];

const LENGTHS: { id: Length; label: string; hint: string }[] = [
  { id: 'short', label: 'Short', hint: '~200 words' },
  { id: 'medium', label: 'Medium', hint: '~600 words' },
  { id: 'detailed', label: 'Detailed', hint: '1000+ words' },
];

const FORMATS: { id: Format; label: string }[] = [
  { id: 'paragraph', label: 'Paragraphs' },
  { id: 'bullets', label: 'Bullet Points' },
  { id: 'step-by-step', label: 'Step-by-Step' },
  { id: 'table', label: 'Table / List' },
];

const EXAMPLES: Record<Category, string> = {
  blog: 'The future of AI agents in business automation',
  code: 'A Python script that scrapes website data and exports to CSV',
  research: 'The impact of large language models on knowledge work',
  email: 'Following up after a product demo with a potential enterprise client',
  brainstorm: 'Monetization strategies for an AI newsletter',
  analyze: 'Monthly user retention metrics showing a drop after week 2',
  social: 'Launching a new AI productivity tool for startup founders',
  explain: 'Retrieval-Augmented Generation (RAG) to a non-technical CEO',
};

function buildPrompt(
  category: Category, topic: string, tone: Tone, length: Length, format: Format, context: string
): string {
  const toneMap: Record<Tone, string> = {
    professional: 'professional and authoritative',
    casual: 'conversational and friendly',
    technical: 'technically precise and detailed',
    creative: 'creative, bold, and engaging',
    concise: 'direct and to the point',
  };
  const lengthMap: Record<Length, string> = {
    short: 'approximately 200 words',
    medium: 'approximately 600 words',
    detailed: '1000+ words with comprehensive coverage',
  };
  const formatMap: Record<Format, string> = {
    paragraph: 'well-structured paragraphs with clear transitions',
    bullets: 'bullet points and concise lists for easy scanning',
    'step-by-step': 'numbered step-by-step format with clear action items',
    table: 'a structured table or comparison list where appropriate',
  };

  const contextLine = context.trim() ? `\n\nAdditional context: ${context.trim()}` : '';

  switch (category) {
    case 'blog':
      return `Write a ${toneMap[tone]} blog post about: "${topic}"

Requirements:
- Length: ${lengthMap[length]}
- Format: ${formatMap[format]}
- Include: a compelling hook in the first sentence, clear H2 section headers, practical takeaways, and a strong conclusion with a call-to-action
- Target audience: professionals and curious learners interested in AI and technology
- Avoid clichés like "In conclusion" or "In today's world"${contextLine}`;

    case 'code':
      return `Write clean, production-ready code for: "${topic}"

Requirements:
- Include: clear variable names, inline comments for complex logic, error handling, and a usage example
- Format: ${formatMap[format]}
- After the code, briefly explain: (1) what it does, (2) how to run it, (3) any dependencies needed
- Complexity level: ${length === 'short' ? 'simple and readable' : length === 'medium' ? 'moderately complex with best practices' : 'comprehensive with edge cases handled'}${contextLine}`;

    case 'research':
      return `Provide a ${toneMap[tone]} research analysis of: "${topic}"

Structure your response using ${formatMap[format]}:
1. Executive Summary (2-3 sentences)
2. Current State & Key Facts
3. Major Trends & Developments
4. Critical Challenges or Counterpoints
5. Future Outlook (next 1-3 years)
6. Key Takeaways & Recommendations

Length: ${lengthMap[length]}
Cite specific data points, research findings, or examples where possible.${contextLine}`;

    case 'email':
      return `Write a ${toneMap[tone]} email for: "${topic}"

Include:
- Subject line (2-3 options)
- Opening that establishes context quickly
- Clear main message (${formatMap[format]})
- Specific, actionable call-to-action
- Professional closing
- Keep it ${length === 'short' ? 'under 150 words' : length === 'medium' ? '150-300 words' : '300-500 words'}${contextLine}`;

    case 'brainstorm':
      return `Generate ${length === 'short' ? '8' : length === 'medium' ? '15' : '25'} creative and diverse ideas for: "${topic}"

Format: ${formatMap[format]}
For each idea include:
- A punchy, memorable title
- 1-2 sentence description explaining the concept
- One key advantage or unique angle

Tone: ${toneMap[tone]}
Push beyond obvious ideas — include at least 3 unconventional or contrarian suggestions.${contextLine}`;

    case 'analyze':
      return `Analyze the following in a ${toneMap[tone]} tone: "${topic}"

Provide your analysis using ${formatMap[format]}:
1. Key Patterns & Observations
2. Root Cause Analysis (what's driving these numbers/trends)
3. Anomalies or Outliers worth investigating
4. Actionable Insights (what to do about this)
5. Recommended Next Steps (ranked by impact)

Length: ${lengthMap[length]}
Present findings for both a technical and non-technical audience.${contextLine}`;

    case 'social':
      return `Create ${length === 'short' ? '3' : length === 'medium' ? '5' : '8'} high-performing social media posts about: "${topic}"

Format: ${formatMap[format]}
For each post:
- Write a scroll-stopping opening hook (first line is everything)
- Keep the tone ${toneMap[tone]}
- Include 3-5 relevant hashtags
- Add a clear call-to-action
- Optimise for LinkedIn (professional network)

Vary the angle: use a mix of insights, questions, contrarian takes, and storytelling.${contextLine}`;

    case 'explain':
      return `Explain "${topic}" in a ${toneMap[tone]} way.

Guidelines:
- Assume: the reader is intelligent but has no background in this specific topic
- Use: ${formatMap[format]}
- Length: ${lengthMap[length]}
- Structure: Start with a one-sentence plain-English definition, then build complexity gradually
- Include: at least 2 real-world analogies or concrete examples
- End with: a "Why this matters" summary and suggested resources for going deeper${contextLine}`;
  }
}

const PROMPT_EXAMPLES = [
  { category: 'blog' as Category, label: 'Blog about AI Agents', topic: 'How AI agents are transforming business automation in 2025' },
  { category: 'explain' as Category, label: 'Explain RAG', topic: 'Retrieval-Augmented Generation (RAG) to a non-technical CEO' },
  { category: 'code' as Category, label: 'Web scraper', topic: 'A Python web scraper that extracts news headlines and exports to CSV' },
  { category: 'email' as Category, label: 'Cold outreach email', topic: 'Introducing an AI analytics tool to a VP of Marketing at a SaaS company' },
];

export default function PromptGeneratorClient() {
  const [category, setCategory] = useState<Category>('blog');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>('professional');
  const [length, setLength] = useState<Length>('medium');
  const [format, setFormat] = useState<Format>('paragraph');
  const [context, setContext] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const generate = useCallback(() => {
    const t = topic.trim() || EXAMPLES[category];
    setGeneratedPrompt(buildPrompt(category, t, tone, length, format, context));
  }, [category, topic, tone, length, format, context]);

  const copy = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyExample = (ex: typeof PROMPT_EXAMPLES[0]) => {
    setCategory(ex.category);
    setTopic(ex.topic);
    setGeneratedPrompt('');
  };

  const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/25 rounded-full text-xs text-brand-blue font-semibold mb-5">
          <Sparkles className="w-3.5 h-3.5" /> Free AI Tool
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
          AI Prompt <span className="gradient-text">Generator</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Build high-quality prompts for ChatGPT, Claude, or Gemini in seconds. No account needed.
        </p>
      </div>

      {/* Quick examples */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {PROMPT_EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => applyExample(ex)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors"
          >
            Try: {ex.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Step 1: Category */}
        <div className="glass rounded-2xl border border-white/8 p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">1. What do you want to create?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setGeneratedPrompt(''); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                  category === cat.id
                    ? 'bg-brand-blue/15 border-brand-blue/40 text-brand-blue'
                    : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8 hover:text-white hover:border-white/15'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                <span className="text-xs font-semibold leading-tight">{cat.label}</span>
                <span className="text-[10px] opacity-60">{cat.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Topic */}
        <div className="glass rounded-2xl border border-white/8 p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">2. What's your topic or task?</p>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={`e.g. ${EXAMPLES[category]}`}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Step 3: Tone + Length */}
        <div className="glass rounded-2xl border border-white/8 p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">3. Customise your output</p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-gray-500 mb-2">Tone</p>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      tone === t.id ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Length</p>
              <div className="flex gap-2">
                {LENGTHS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLength(l.id)}
                    className={`flex-1 text-xs py-1.5 rounded-full border transition-all flex flex-col items-center gap-0.5 ${
                      length === l.id ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span className="font-semibold">{l.label}</span>
                    <span className="opacity-60 text-[10px]">{l.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white mt-4 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Advanced options (format, extra context)
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 pt-4 border-t border-white/8">
              <div>
                <p className="text-xs text-gray-500 mb-2">Output Format</p>
                <div className="flex flex-wrap gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        format === f.id ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Extra context (optional)</p>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Add any extra details, audience info, constraints, or examples..."
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          className="w-full btn-gradient py-4 text-white font-bold rounded-xl flex items-center justify-center gap-3 text-base hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-5 h-5" /> Generate Prompt
        </button>

        {/* Output */}
        {generatedPrompt && (
          <div className="glass rounded-2xl border border-brand-blue/25 bg-brand-blue/4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-blue" />
                <p className="text-sm font-semibold text-white">Your Prompt</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGeneratedPrompt(buildPrompt(category, topic.trim() || EXAMPLES[category], tone, length, format, context))}
                  className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/8 transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={copy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand-blue text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <pre className="px-5 py-5 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
              {generatedPrompt}
            </pre>
          </div>
        )}

        {/* Tips */}
        <div className="glass rounded-2xl border border-white/8 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pro Tips</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2"><span className="text-brand-blue mt-0.5">→</span> Add specific constraints: "in under 500 words", "no jargon", "aimed at C-suite"</li>
            <li className="flex items-start gap-2"><span className="text-brand-blue mt-0.5">→</span> Include your audience: "for a 23-year-old non-technical founder in India"</li>
            <li className="flex items-start gap-2"><span className="text-brand-blue mt-0.5">→</span> Ask for multiple variations: add "Give me 3 different versions" at the end</li>
            <li className="flex items-start gap-2"><span className="text-brand-blue mt-0.5">→</span> Iterate: use the output as a starting point, then refine with follow-up messages</li>
          </ul>
        </div>

        {/* Cross-links */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/glossary/prompt-engineering" className="glass rounded-xl border border-white/8 hover:border-brand-blue/30 p-4 flex items-center gap-3 group transition-all">
            <div className="w-9 h-9 rounded-lg bg-brand-blue/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-brand-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-brand-blue transition-colors">Learn Prompt Engineering</p>
              <p className="text-xs text-gray-500">Deep dive in our AI Glossary</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-blue ml-auto transition-colors" />
          </Link>
          <Link href="/tools" className="glass rounded-xl border border-white/8 hover:border-brand-blue/30 p-4 flex items-center gap-3 group transition-all">
            <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-brand-blue transition-colors">Browse AI Tools</p>
              <p className="text-xs text-gray-500">Find the right AI for your task</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-blue ml-auto transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
