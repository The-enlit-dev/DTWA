'use client';

import { useState, useMemo } from 'react';
import { Calculator, Users, Zap, DollarSign, TrendingUp, Info, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface AITool {
  id: string;
  name: string;
  category: string;
  monthlyUSD: number;
  annualDiscountPct: number;
  freeTier: string | null;
  description: string;
  bestFor: string[];
  usageScaling: 'flat' | 'per_seat' | 'usage_based';
  heavyMultiplier: number;
}

const TOOLS: AITool[] = [
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    category: 'Writing & Chat',
    monthlyUSD: 20,
    annualDiscountPct: 0,
    freeTier: 'Free tier available (GPT-3.5)',
    description: "OpenAI's flagship AI assistant with GPT-4o",
    bestFor: ['Writing', 'Coding', 'Research'],
    usageScaling: 'per_seat',
    heavyMultiplier: 1,
  },
  {
    id: 'chatgpt-team',
    name: 'ChatGPT Team',
    category: 'Writing & Chat',
    monthlyUSD: 30,
    annualDiscountPct: 17,
    freeTier: null,
    description: 'ChatGPT for teams with admin controls and higher limits',
    bestFor: ['Teams', 'Collaboration', 'Business'],
    usageScaling: 'per_seat',
    heavyMultiplier: 1,
  },
  {
    id: 'claude-pro',
    name: 'Claude Pro',
    category: 'Writing & Chat',
    monthlyUSD: 20,
    annualDiscountPct: 0,
    freeTier: 'Free tier available',
    description: "Anthropic's Claude with 200K context window and priority access",
    bestFor: ['Long documents', 'Analysis', 'Writing'],
    usageScaling: 'per_seat',
    heavyMultiplier: 1,
  },
  {
    id: 'claude-team',
    name: 'Claude Team',
    category: 'Writing & Chat',
    monthlyUSD: 30,
    annualDiscountPct: 0,
    freeTier: null,
    description: 'Claude for teams with admin dashboard and higher usage',
    bestFor: ['Teams', 'Enterprise', 'Research'],
    usageScaling: 'per_seat',
    heavyMultiplier: 1,
  },
  {
    id: 'gemini-advanced',
    name: 'Gemini Advanced',
    category: 'Writing & Chat',
    monthlyUSD: 20,
    annualDiscountPct: 0,
    freeTier: 'Free Gemini available',
    description: "Google's most capable AI with 1M context and Google Workspace integration",
    bestFor: ['Google users', 'Research', 'Multimodal'],
    usageScaling: 'per_seat',
    heavyMultiplier: 1,
  },
  {
    id: 'cursor',
    name: 'Cursor Pro',
    category: 'Coding',
    monthlyUSD: 20,
    annualDiscountPct: 17,
    freeTier: 'Free tier (limited)',
    description: 'AI-powered code editor built on VS Code with Copilot++ and agent mode',
    bestFor: ['Developers', 'Full-stack', 'Refactoring'],
    usageScaling: 'per_seat',
    heavyMultiplier: 1,
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'Coding',
    monthlyUSD: 10,
    annualDiscountPct: 17,
    freeTier: 'Free for students',
    description: "GitHub's AI pair programmer integrated into VS Code, JetBrains, and more",
    bestFor: ['Autocomplete', 'GitHub users', 'Enterprise'],
    usageScaling: 'per_seat',
    heavyMultiplier: 1,
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'Image Generation',
    monthlyUSD: 10,
    annualDiscountPct: 20,
    freeTier: null,
    description: 'Leading AI image generator known for artistic quality',
    bestFor: ['Design', 'Marketing', 'Art'],
    usageScaling: 'usage_based',
    heavyMultiplier: 3,
  },
  {
    id: 'dalle',
    name: 'DALL·E (via ChatGPT)',
    category: 'Image Generation',
    monthlyUSD: 0,
    annualDiscountPct: 0,
    freeTier: 'Included with ChatGPT Plus',
    description: "OpenAI's image generator, bundled with ChatGPT Plus subscription",
    bestFor: ['Quick images', 'ChatGPT users', 'Concept art'],
    usageScaling: 'flat',
    heavyMultiplier: 1,
  },
  {
    id: 'grammarly-pro',
    name: 'Grammarly Pro',
    category: 'Writing',
    monthlyUSD: 12,
    annualDiscountPct: 50,
    freeTier: 'Free tier available',
    description: 'AI writing assistant for grammar, style, and tone across all platforms',
    bestFor: ['Writers', 'Non-native speakers', 'Professionals'],
    usageScaling: 'per_seat',
    heavyMultiplier: 1,
  },
  {
    id: 'notion-ai',
    name: 'Notion AI',
    category: 'Productivity',
    monthlyUSD: 10,
    annualDiscountPct: 20,
    freeTier: 'Requires Notion plan',
    description: "AI features baked into Notion — writing, summarizing, and Q&A on your docs",
    bestFor: ['Notion users', 'Teams', 'Documentation'],
    usageScaling: 'per_seat',
    heavyMultiplier: 1,
  },
  {
    id: 'perplexity-pro',
    name: 'Perplexity Pro',
    category: 'Research',
    monthlyUSD: 20,
    annualDiscountPct: 17,
    freeTier: 'Free tier available',
    description: 'AI-powered search engine with cited sources and deep research mode',
    bestFor: ['Research', 'Fact-checking', 'Students'],
    usageScaling: 'per_seat',
    heavyMultiplier: 1,
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs Starter',
    category: 'Audio & Voice',
    monthlyUSD: 5,
    annualDiscountPct: 0,
    freeTier: 'Free tier (10k chars/mo)',
    description: 'Realistic AI voice cloning and text-to-speech for content creators',
    bestFor: ['Podcasts', 'Videos', 'Audiobooks'],
    usageScaling: 'usage_based',
    heavyMultiplier: 4,
  },
  {
    id: 'runway',
    name: 'Runway Standard',
    category: 'Video',
    monthlyUSD: 15,
    annualDiscountPct: 33,
    freeTier: 'Free tier (limited credits)',
    description: 'AI video generation and editing — text-to-video, inpainting, and more',
    bestFor: ['Video creators', 'Filmmakers', 'Marketing'],
    usageScaling: 'usage_based',
    heavyMultiplier: 5,
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(TOOLS.map((t) => t.category))).sort()];
const USD_TO_INR = 83.5;

type UsageLevel = 'light' | 'moderate' | 'heavy';

const usageLabels: Record<UsageLevel, string> = {
  light: 'Light (few times/week)',
  moderate: 'Moderate (daily use)',
  heavy: 'Heavy (power user)',
};

const usageMultipliers: Record<UsageLevel, number> = {
  light: 0.7,
  moderate: 1.0,
  heavy: 1.4,
};

export default function CalculatorClient() {
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [teamSize, setTeamSize] = useState(1);
  const [usageLevel, setUsageLevel] = useState<UsageLevel>('moderate');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [filterCategory, setFilterCategory] = useState('All');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const toggleTool = (id: string) => {
    setSelectedTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTools = useMemo(
    () => TOOLS.filter((t) => filterCategory === 'All' || t.category === filterCategory),
    [filterCategory]
  );

  const breakdown = useMemo(() => {
    return TOOLS.filter((t) => selectedTools.has(t.id)).map((tool) => {
      const seats = tool.usageScaling === 'per_seat' ? teamSize : 1;
      const usageMult =
        tool.usageScaling === 'usage_based'
          ? usageLevel === 'heavy'
            ? tool.heavyMultiplier
            : usageMultipliers[usageLevel]
          : 1;
      const annualMult = billingCycle === 'annual' ? 1 - tool.annualDiscountPct / 100 : 1;
      const monthlyUSD = tool.monthlyUSD * seats * usageMult * annualMult;
      return { ...tool, monthlyUSD, annualUSD: monthlyUSD * 12, seats };
    });
  }, [selectedTools, teamSize, usageLevel, billingCycle]);

  const totals = useMemo(() => {
    const monthlyUSD = breakdown.reduce((s, t) => s + t.monthlyUSD, 0);
    return { monthlyUSD, annualUSD: monthlyUSD * 12 };
  }, [breakdown]);

  const fmt = (usd: number) =>
    currency === 'INR'
      ? `₹${Math.round(usd * USD_TO_INR).toLocaleString('en-IN')}`
      : `$${usd.toFixed(2)}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/25 rounded-full text-xs text-brand-blue font-semibold mb-5">
          <Calculator className="w-3.5 h-3.5" /> AI Cost Calculator
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
          What Will AI Cost <span className="gradient-text">Your Team?</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Select the tools you use, set your team size, and get an instant monthly estimate in USD or INR.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Config + Tool Picker */}
        <div className="lg:col-span-2 space-y-6">
          {/* Config panel */}
          <div className="glass rounded-xl p-5 border border-white/8">
            <h2 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-blue" /> Usage Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Team size */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 font-medium">
                  <Users className="w-3.5 h-3.5" /> Team Size
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="flex-1 accent-brand-blue"
                  />
                  <span className="text-white font-bold text-sm w-16 text-right">
                    {teamSize} {teamSize === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1</span><span>10</span><span>25</span><span>50</span>
                </div>
              </div>

              {/* Usage level */}
              <div>
                <label className="text-xs text-gray-400 mb-2 font-medium block">Usage Intensity</label>
                <div className="space-y-1.5">
                  {(['light', 'moderate', 'heavy'] as UsageLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setUsageLevel(level)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all border ${
                        usageLevel === level
                          ? 'bg-brand-blue/15 border-brand-blue/40 text-brand-blue'
                          : 'bg-white/4 border-white/8 text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span>{usageLabels[level]}</span>
                      {usageLevel === level && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Billing + currency toggles */}
            <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-white/8">
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
                {(['monthly', 'annual'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setBillingCycle(c)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      billingCycle === c ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {c === 'monthly' ? 'Monthly' : 'Annual (save ~17%)'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
                {(['USD', 'INR'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      currency === c ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {c === 'USD' ? '$ USD' : '₹ INR'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  filterCategory === cat
                    ? 'bg-brand-blue text-white border-transparent'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border-white/8'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tool list */}
          <div className="space-y-2">
            {filteredTools.map((tool) => {
              const isSelected = selectedTools.has(tool.id);
              const isExpanded = expandedTool === tool.id;
              return (
                <div
                  key={tool.id}
                  className={`glass rounded-xl border transition-all ${
                    isSelected ? 'border-brand-blue/40 bg-brand-blue/4' : 'border-white/8 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => toggleTool(tool.id)}
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-brand-blue border-brand-blue'
                          : 'border-white/20 hover:border-brand-blue/50'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{tool.name}</span>
                        <span className="text-xs text-gray-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                          {tool.category}
                        </span>
                        {tool.freeTier && (
                          <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                            Free tier
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{tool.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-white">
                        {tool.monthlyUSD === 0 ? (
                          <span className="text-green-400">Bundled</span>
                        ) : (
                          `$${tool.monthlyUSD}/mo`
                        )}
                      </div>
                      {tool.annualDiscountPct > 0 && (
                        <div className="text-xs text-green-400">{tool.annualDiscountPct}% off annual</div>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedTool(isExpanded ? null : tool.id)}
                      className="text-gray-500 hover:text-white transition-colors shrink-0 ml-1"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-white/6 mt-0">
                      <div className="mt-3 space-y-2">
                        {tool.freeTier && (
                          <p className="text-xs text-green-400 flex items-center gap-1.5">
                            <Info className="w-3 h-3" /> {tool.freeTier}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {tool.bestFor.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs text-gray-400 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {tool.usageScaling === 'usage_based' && (
                          <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                            <Info className="w-3 h-3" /> Usage-based pricing — heavy use increases cost
                          </p>
                        )}
                        {tool.usageScaling === 'per_seat' && teamSize > 1 && (
                          <p className="text-xs text-blue-400 flex items-center gap-1.5">
                            <Users className="w-3 h-3" /> Per-seat pricing &times; {teamSize} people
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Summary panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Total card */}
            <div className="glass rounded-xl p-5 border border-brand-blue/25 bg-brand-blue/5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-brand-blue" />
                <h3 className="font-semibold text-white text-sm">Estimated Total</h3>
              </div>

              {selectedTools.size === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">Select tools to see your estimate</p>
              ) : (
                <>
                  <div className="text-center py-4">
                    <div className="text-3xl font-display font-bold text-white mb-1">
                      {fmt(totals.monthlyUSD)}
                    </div>
                    <div className="text-xs text-gray-500">per month</div>
                    <div className="mt-2 text-sm text-gray-400">
                      {fmt(totals.annualUSD)}{' '}
                      <span className="text-gray-600">/ year</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <div className="mt-1 text-xs text-green-400">Annual billing applied</div>
                    )}
                  </div>

                  <div className="space-y-2 mt-4 pt-4 border-t border-white/8">
                    {breakdown.map((tool) => (
                      <div key={tool.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 truncate mr-2">{tool.name}</span>
                        <span className="text-white font-medium shrink-0">
                          {tool.monthlyUSD === 0 ? (
                            <span className="text-green-400">Free</span>
                          ) : (
                            fmt(tool.monthlyUSD)
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/8 space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Tools selected</span>
                      <span className="text-white">{selectedTools.size}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Team size</span>
                      <span className="text-white">{teamSize}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Tips card */}
            <div className="glass rounded-xl p-4 border border-white/8">
              <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-brand-blue" /> Cost-saving tips
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-brand-blue mt-0.5">→</span>
                  Annual billing saves ~17-20% on most tools
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-brand-blue mt-0.5">→</span>
                  ChatGPT Plus includes DALL·E — no separate image tool needed
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-brand-blue mt-0.5">→</span>
                  Gemini Advanced includes Workspace AI at no extra cost
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-brand-blue mt-0.5">→</span>
                  Start with free tiers to validate before committing
                </li>
              </ul>
            </div>

            <p className="text-xs text-gray-600 text-center">
              INR estimates at 1 USD = ₹{USD_TO_INR}. Prices are approximate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
