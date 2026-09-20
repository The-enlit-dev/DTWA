'use client';

import { useEffect, useState } from 'react';
import { Article } from '@/lib/types';

export default function ArticleContent({ article }: { article: Article }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="reading-progress-bar"
      style={{ width: `${progress}%` }}
      aria-hidden="true"
    />
  );
}
