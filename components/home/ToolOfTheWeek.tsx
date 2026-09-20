import Link from 'next/link';
import { Star, ExternalLink, Cpu, Zap, DollarSign, Award } from 'lucide-react';
import { AiTool } from '@/lib/types';

const pricingLabel: Record<string, string> = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
  open_source: 'Open Source',
  enterprise: 'Enterprise',
};

const pricingColors: Record<string, string> = {
  free: 'text-green-400 bg-green-400/10 border-green-400/25',
  freemium: 'text-blue-400 bg-blue-400/10 border-blue-400/25',
  paid: 'text-orange-400 bg-orange-400/10 border-orange-400/25',
  open_source: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
  enterprise: 'text-red-400 bg-red-400/10 border-red-400/25',
};

export default function ToolOfTheWeek({ tool }: { tool: AiTool }) {
  const pricing = pricingColors[tool.pricing_model] || pricingColors.freemium;
  const pros = Array.isArray(tool.pros) ? tool.pros.slice(0, 3) : [];

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <Award className="w-5 h-5 text-brand-orange" />
        <h2 className="font-display font-bold text-xl text-white">AI Tool of the Week</h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-brand-800/40">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid md:grid-cols-2 gap-0">
          {/* Left: identity */}
          <div className="p-7 md:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs font-semibold text-brand-orange uppercase tracking-wider bg-brand-orange/10 border border-brand-orange/25 px-2.5 py-1 rounded-full">
                Editor's Pick
              </span>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-brand-700 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
                {tool.logo_url ? (
                  <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover" />
                ) : (
                  <Cpu className="w-8 h-8 text-brand-blue" />
                )}
              </div>
              <div>
                <h3 className="font-display font-bold text-2xl text-white">{tool.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.round(tool.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                    />
                  ))}
                  <span className="text-sm text-gray-400 ml-1 font-medium">{tool.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <p className="text-gray-300 text-base leading-relaxed mb-6">
              {tool.description || tool.short_description}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-sm px-3 py-1 rounded-full border font-medium ${pricing}`}>
                <DollarSign className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                {pricingLabel[tool.pricing_model] || tool.pricing_model}
              </span>
              {tool.category && (
                <span className="text-sm text-gray-400 bg-white/5 border border-white/8 px-3 py-1 rounded-full">
                  {tool.category}
                </span>
              )}
            </div>
          </div>

          {/* Right: details */}
          <div className="p-7 md:p-10 md:border-l border-t md:border-t-0 border-white/8 flex flex-col justify-center">
            {pros.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-3">
                  <Zap className="w-4 h-4 text-brand-blue" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Why it stands out</span>
                </div>
                <ul className="space-y-2.5">
                  {pros.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tool.short_description && (
              <div className="mb-7 p-4 bg-brand-blue/8 border border-brand-blue/20 rounded-xl">
                <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider mb-1.5">Best For</div>
                <p className="text-sm text-gray-300 leading-relaxed">{tool.short_description}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Link
                href={`/tools/${tool.slug}`}
                className="flex-1 text-center py-2.5 text-sm font-semibold text-white btn-gradient rounded-xl transition-all"
              >
                Read Full Review
              </Link>
              {tool.website_url && (
                <a
                  href={tool.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 py-2.5 px-4 text-sm text-gray-300 border border-white/10 rounded-xl hover:border-white/20 hover:text-white transition-all"
                >
                  <ExternalLink className="w-4 h-4" /> Visit
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
