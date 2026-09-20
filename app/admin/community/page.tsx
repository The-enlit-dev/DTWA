'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, MessageCircle, TrendingUp, MousePointerClick, ExternalLink, Check } from 'lucide-react';

interface ClickStats {
  platform: string;
  source: string;
  count: number;
}

export default function AdminCommunityPage() {
  const [discordUrl, setDiscordUrl] = useState('');
  const [redditUrl, setRedditUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [clickStats, setClickStats] = useState<ClickStats[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('community_settings')
        .select('discord_url, reddit_url')
        .eq('id', 1)
        .maybeSingle();

      if (data) {
        setDiscordUrl(data.discord_url);
        setRedditUrl(data.reddit_url);
      }
      setLoading(false);
    })();

    (async () => {
      const { data } = await supabase
        .from('community_clicks')
        .select('platform, source')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (data) {
        const stats: Record<string, number> = {};
        data.forEach((row) => {
          const key = `${row.platform}-${row.source}`;
          stats[key] = (stats[key] || 0) + 1;
        });
        const formatted = Object.entries(stats).map(([key, count]) => {
          const [platform, source] = key.split('-');
          return { platform, source, count };
        });
        setClickStats(formatted);
        setTotalClicks(data.length);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in.');
      setSaving(false);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc('update_community_settings', {
      p_discord_url: discordUrl,
      p_reddit_url: redditUrl,
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
      </div>
    );
  }

  const discordClicks = clickStats.filter((s) => s.platform === 'discord').reduce((sum, s) => sum + s.count, 0);
  const redditClicks = clickStats.filter((s) => s.platform === 'reddit').reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2">Community Settings</h1>
        <p className="text-sm text-gray-500">Manage your Discord and Reddit invite links. These appear across the site — navbar, footer, homepage, and community page.</p>
      </div>

      {/* Click stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 border border-white/8">
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick className="w-4 h-4 text-brand-blue" />
            <span className="text-xs text-gray-500">Total Clicks</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">{totalClicks}</div>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/8">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
            <span className="text-xs text-gray-500">Discord Clicks</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">{discordClicks}</div>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/8">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.197-.547-.66 3.005c1.555.07 2.956.547 3.934 1.27.4-.333.913-.535 1.473-.535 1.27 0 2.298 1.029 2.298 2.298 0 .89-.508 1.66-1.252 2.045-.034.145-.052.294-.052.448 0 2.236-2.626 4.05-5.866 4.05s-5.866-1.814-5.866-4.05c0-.154-.018-.303-.052-.448-.744-.385-1.252-1.155-1.252-2.045 0-1.27 1.028-2.298 2.298-2.298.56 0 1.073.202 1.473.535.978-.723 2.379-1.2 3.934-1.27l.743-3.395a.249.249 0 0 1 .27-.19l2.413.601c.226-.466.7-.786 1.25-.786zM8.5 11.5c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm7 0c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm-3.5 6.5c-1.105 0-2 .895-2 2 0 1.105.895 2 2 2s2-.895 2-2c0-1.105-.895-2-2-2z" /></svg>
            <span className="text-xs text-gray-500">Reddit Clicks</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">{redditClicks}</div>
        </div>
      </div>

      {/* Settings form */}
      <div className="glass rounded-2xl border border-white/8 p-6 space-y-6">
        {/* Discord */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
            <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
            Discord Invite URL
          </label>
          <input
            type="url"
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
            placeholder="https://discord.gg/yourinvite"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-blue/50 focus:bg-white/8 transition-all"
          />
          <p className="text-xs text-gray-600 mt-1.5">Paste your Discord server invite link here.</p>
        </div>

        {/* Reddit */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
            <svg className="w-4 h-4 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.197-.547-.66 3.005c1.555.07 2.956.547 3.934 1.27.4-.333.913-.535 1.473-.535 1.27 0 2.298 1.029 2.298 2.298 0 .89-.508 1.66-1.252 2.045-.034.145-.052.294-.052.448 0 2.236-2.626 4.05-5.866 4.05s-5.866-1.814-5.866-4.05c0-.154-.018-.303-.052-.448-.744-.385-1.252-1.155-1.252-2.045 0-1.27 1.028-2.298 2.298-2.298.56 0 1.073.202 1.473.535.978-.723 2.379-1.2 3.934-1.27l.743-3.395a.249.249 0 0 1 .27-.19l2.413.601c.226-.466.7-.786 1.25-.786zM8.5 11.5c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm7 0c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm-3.5 6.5c-1.105 0-2 .895-2 2 0 1.105.895 2 2 2s2-.895 2-2c0-1.105-.895-2-2-2z" /></svg>
            Reddit Community URL
          </label>
          <input
            type="url"
            value={redditUrl}
            onChange={(e) => setRedditUrl(e.target.value)}
            placeholder="https://www.reddit.com/r/YourSubreddit"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-blue/50 focus:bg-white/8 transition-all"
          />
          <p className="text-xs text-gray-600 mt-1.5">Paste your subreddit URL here.</p>
        </div>

        {/* Error / success */}
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}
        {saved && (
          <div className="px-4 py-3 bg-green-500/10 border border-green-500/25 rounded-xl text-sm text-green-400 flex items-center gap-2">
            <Check className="w-4 h-4" /> Settings saved successfully.
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 btn-gradient text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Test Discord link
          </a>
          <a
            href={redditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Test Reddit link
          </a>
        </div>
      </div>

      {/* Click breakdown */}
      {clickStats.length > 0 && (
        <div className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-blue" /> Click Breakdown by Source
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {clickStats.map((stat, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${stat.platform === 'discord' ? 'bg-[#5865F2]' : 'bg-[#FF4500]'}`} />
                  <span className="text-sm text-gray-300 capitalize">{stat.platform}</span>
                  <span className="text-xs text-gray-600">·</span>
                  <span className="text-xs text-gray-500 capitalize">{stat.source.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-sm font-semibold text-white">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
