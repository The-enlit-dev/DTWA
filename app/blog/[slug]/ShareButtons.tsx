'use client';

import { Link2, CheckCheck, Twitter, Linkedin } from 'lucide-react';
import { useState } from 'react';

export default function ShareButtons({ title, compact = false }: { title: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <button onClick={copy} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-xs w-full">
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-sky-500/15 hover:text-sky-400 transition-colors text-xs">
          <Twitter className="w-3.5 h-3.5" /> Share on X
        </a>
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-blue-600/15 hover:text-blue-400 transition-colors text-xs">
          <Linkedin className="w-3.5 h-3.5" /> Share on LinkedIn
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-6 border-y border-white/8">
      <span className="text-sm text-gray-500 mr-1">Share:</span>
      <button onClick={copy} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm">
        {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-sky-500/15 hover:text-sky-400 transition-colors text-sm">
        <Twitter className="w-4 h-4" /> X
      </a>
      <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-blue-600/15 hover:text-blue-400 transition-colors text-sm">
        <Linkedin className="w-4 h-4" /> LinkedIn
      </a>
    </div>
  );
}

