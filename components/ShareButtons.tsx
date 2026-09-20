'use client';

import { Link2, CheckCheck, Share2, Twitter, Linkedin, Facebook } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
}

export default function ShareButtons({ title, url, description = '' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [hasWebShare, setHasWebShare] = useState(false);

  // Detect Web Share API support on mount (client-only)
  useEffect(() => {
    setHasWebShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const trackShare = () => {
    // Fire and forget event tracking
    supabase.rpc('record_content_event', {
      p_event_type: 'share',
      p_content_type: 'article',
      p_content_id: url,
      p_content_slug: url,
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackShare();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const webShare = async () => {
    try {
      await navigator.share({ title, text: description, url });
      trackShare();
    } catch {
      /* user cancelled — ignore */
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const linkClasses =
    'flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors';
  const copiedClasses = 'text-green-400';

  return (
    <div className="flex items-center gap-2">
      <button onClick={copy} className={`${linkClasses} ${copied ? copiedClasses : ''}`} aria-label="Copy link">
        {copied ? <CheckCheck className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </button>

      {copied && (
        <span className="text-xs text-green-400 font-medium">Copied!</span>
      )}

      {hasWebShare && (
        <button onClick={webShare} className={linkClasses} aria-label="Share">
          <Share2 className="w-4 h-4" />
        </button>
      )}

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={trackShare}
        className={`${linkClasses} hover:bg-sky-500/15 hover:text-sky-400 hover:border-sky-500/20`}
        aria-label="Share on X / Twitter"
      >
        <Twitter className="w-4 h-4" />
      </a>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={trackShare}
        className={`${linkClasses} hover:bg-blue-600/15 hover:text-blue-400 hover:border-blue-600/20`}
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </a>

      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={trackShare}
        className={`${linkClasses} hover:bg-blue-700/15 hover:text-blue-500 hover:border-blue-700/20`}
        aria-label="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </a>
    </div>
  );
}
