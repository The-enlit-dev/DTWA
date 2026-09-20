import Link from 'next/link';
import { Star, ArrowRight, ExternalLink, Cpu } from 'lucide-react';
import { AiTool } from '@/lib/types';

const pricingColors: Record<string, string> = {
  free: 'text-green-400 bg-green-400/10 border-green-400/20',
  freemium: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  paid: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  open_source: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  enterprise: 'text-red-400 bg-red-400/10 border-red-400/20',
};

function ToolCard({ tool }: { tool: AiTool }) {
  return (
    <div className="glass-hover rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-700 border border-white/8 flex items-center justify-center shrink-0 overflow-hidden">
          {tool.logo_url ? (
            <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover" />
          ) : (
            <Cpu className="w-5 h-5 text-brand-blue" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-white text-sm">{tool.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${pricingColors[tool.pricing_model] || pricingColors.freemium}`}>
              {tool.pricing_model.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < Math.round(tool.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">{tool.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
        {tool.short_description}
      </p>
      <div className="flex items-center gap-2 mt-auto">
        <Link
          href={`/tools/${tool.slug}`}
          className="flex-1 text-center py-1.5 text-xs text-brand-blue border border-brand-blue/30 rounded-lg hover:bg-brand-blue/10 transition-colors"
        >
          View Details
        </Link>
        <a
          href={tool.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-gray-500 hover:text-white border border-white/8 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function ToolsSpotlight({ tools }: { tools: AiTool[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-brand-blue" />
          <h2 className="font-display font-bold text-xl text-white">AI Tools Spotlight</h2>
        </div>
        <Link href="/tools" className="text-sm text-brand-blue hover:text-blue-300 flex items-center gap-1 transition-colors">
          All tools <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
