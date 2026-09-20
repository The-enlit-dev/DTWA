'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Youtube, Mail, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCommunitySettings, useCommunityClick } from '@/lib/community';

const footerLinks = {
  Content: [
    { label: 'Blog', href: '/blog' },
    { label: 'AI News', href: '/news' },
    { label: 'Video Library', href: '/videos' },
    { label: 'AI Tools', href: '/tools' },
  ],
  Discover: [
    { label: 'Company Database', href: '/companies' },
    { label: 'Tool Comparisons', href: '/compare' },
    { label: 'AI Glossary', href: '/glossary' },
    { label: 'Tool Finder', href: '/tool-finder' },
    { label: 'Cost Calculator', href: '/calculator' },
    { label: 'Newsletter', href: '/newsletter' },
  ],
  Learn: [
    { label: 'Learning Hub', href: '/learning-hub' },
    { label: 'Courses', href: '/courses' },
    { label: 'Community', href: '/community' },
    { label: 'Newsletter', href: '/newsletter' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Feedback', href: '/feedback' },
  ],
};

export default function Footer() {
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const { settings } = useCommunitySettings();
  const trackClick = useCommunityClick();

  useEffect(() => {
    // Check localStorage flag set on subscribe
    if (typeof window !== 'undefined' && localStorage.getItem('dt_subscribed') === '1') {
      setNewsletterSubscribed(true);
      return;
    }
    // Also check via session email
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.email) return;
      const { data } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', session.user.email)
        .maybeSingle();
      if (data) {
        setNewsletterSubscribed(true);
        localStorage.setItem('dt_subscribed', '1');
      }
    });
  }, []);

  return (
    <footer className="bg-brand-950 border-t border-white/6">
      {/* Newsletter Banner — hidden when already subscribed */}
      {!newsletterSubscribed && (
        <div className="border-b border-white/6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="gradient-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-display font-bold text-xl text-white mb-1">Stay ahead of the AI curve</h3>
                <p className="text-gray-400 text-sm">Weekly breakdown of AI tools, company moves & tech trends — straight to your inbox.</p>
              </div>
              <Link href="/newsletter" className="btn-gradient flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl shrink-0 text-sm">
                Subscribe Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src="/decoding_tomorow_logo copy.png" alt="Decoding Tomorrow" width={40} height={40} className="rounded-full" />
              <div>
                <div className="font-display font-bold text-white text-base leading-tight">Decoding Tomorrow</div>
                <div className="text-xs text-gray-500">with Attharva</div>
              </div>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-5 max-w-xs">
              Decoding the Future of AI, Business & Technology. Deep analysis on the tools, companies, and ideas shaping tomorrow.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.youtube.com/@DecodingTomorrowWithAttharva"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-red-500 transition-colors hover:border-white/20"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="mailto:decodingtomorrowwithattharva@gmail.com"
                aria-label="Email"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-green-400 transition-colors hover:border-white/20"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href={settings.discord_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                onClick={() => trackClick('discord', 'footer')}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-[#5865F2] transition-colors hover:border-white/20"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              <a
                href={settings.reddit_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Reddit"
                onClick={() => trackClick('reddit', 'footer')}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-[#FF4500] transition-colors hover:border-white/20"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.197-.547-.66 3.005c1.555.07 2.956.547 3.934 1.27.4-.333.913-.535 1.473-.535 1.27 0 2.298 1.029 2.298 2.298 0 .89-.508 1.66-1.252 2.045-.034.145-.052.294-.052.448 0 2.236-2.626 4.05-5.866 4.05s-5.866-1.814-5.866-4.05c0-.154-.018-.303-.052-.448-.744-.385-1.252-1.155-1.252-2.045 0-1.27 1.028-2.298 2.298-2.298.56 0 1.073.202 1.473.535.978-.723 2.379-1.2 3.934-1.27l.743-3.395a.249.249 0 0 1 .27-.19l2.413.601c.226-.466.7-.786 1.25-.786zM8.5 11.5c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm7 0c-.828 0-1.5.671-1.5 1.5s.672 1.5 1.5 1.5 1.5-.671 1.5-1.5-.672-1.5-1.5-1.5zm-3.5 6.5c-1.105 0-2 .895-2 2 0 1.105.895 2 2 2s2-.895 2-2c0-1.105-.895-2-2-2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-gray-200 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Decoding Tomorrow with Attharva. All rights reserved.
          </p>
          <a
            href="https://www.youtube.com/@DecodingTomorrowWithAttharva"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors"
          >
            <Youtube className="w-3.5 h-3.5" />
            YouTube Channel
          </a>
        </div>
      </div>
    </footer>
  );
}
