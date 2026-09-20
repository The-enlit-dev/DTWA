'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface CommunitySettings {
  discord_url: string;
  reddit_url: string;
}

const DEFAULT_SETTINGS: CommunitySettings = {
  discord_url: 'https://discord.gg/decodingtomorrow',
  reddit_url: 'https://www.reddit.com/r/DecodingTomorrow',
};

export function useCommunitySettings() {
  const [settings, setSettings] = useState<CommunitySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('community_settings')
      .select('discord_url, reddit_url')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data);
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}

export function trackCommunityClick(platform: 'discord' | 'reddit', source: string, userId?: string) {
  supabase.from('community_clicks').insert({
    platform,
    source,
    user_id: userId ?? null,
  }).then(() => {});
}

export function useCommunityClick() {
  return useCallback((platform: 'discord' | 'reddit', source: string, userId?: string) => {
    trackCommunityClick(platform, source, userId);
  }, []);
}
