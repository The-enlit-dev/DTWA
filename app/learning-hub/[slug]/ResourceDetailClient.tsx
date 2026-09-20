'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, Eye, ArrowLeft, FileText, ExternalLink, Calendar, Folder, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';

const fileTypeColors: Record<string, string> = {
  pdf: 'text-red-400 bg-red-400/10 border-red-400/20',
  ppt: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  pptx: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  doc: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  docx: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  image: 'text-green-400 bg-green-400/10 border-green-400/20',
  link: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  other: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

export default function ResourceDetailClient({ slug }: { slug: string }) {
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('learning_resources')
        .select('*, category:learning_categories(id, name, slug, icon)')
        .eq('slug', slug)
        .maybeSingle();

      if (!data || (!data.is_published && !data.author_id)) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setResource(data);
      setLoading(false);

      // Track view
      supabase.rpc('increment_resource_view', { resource_slug: slug }).then(() => {});
    })();
  }, [slug]);

  const handleDownload = () => {
    supabase.rpc('increment_resource_download', { resource_slug: slug }).then(() => {});
    if (resource.file_url) {
      window.open(resource.file_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl text-white mb-3">Resource Not Found</h1>
        <p className="text-gray-500 mb-6">This resource may have been removed or is no longer available.</p>
        <Link href="/learning-hub" className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white text-sm font-semibold rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Back to Learning Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/learning-hub" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Learning Hub
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="glass rounded-2xl border border-white/8 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className={`shrink-0 w-14 h-14 rounded-xl border flex items-center justify-center ${fileTypeColors[resource.file_type] || fileTypeColors.other}`}>
                <FileText className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-bold text-2xl text-white mb-2">{resource.title}</h1>
                <p className="text-sm text-gray-400 leading-relaxed">{resource.description}</p>
              </div>
            </div>

            {resource.tags && resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {resource.tags.map((tag: string) => (
                  <span key={tag} className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/8">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Embedded viewer */}
          {resource.file_type === 'pdf' && resource.file_url && (
            <div className="glass rounded-2xl border border-white/8 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-blue" /> Document Preview
                </h3>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-blue-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
              <iframe
                src={resource.file_url}
                className="w-full h-[600px] bg-white/5"
                title={resource.title}
              />
            </div>
          )}

          {resource.file_type === 'link' && resource.file_url && (
            <div className="glass rounded-2xl border border-white/8 p-6 text-center">
              <ExternalLink className="w-8 h-8 text-brand-blue mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-4">This is an external resource. Click below to open it in a new tab.</p>
              <a
                href={resource.file_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white text-sm font-semibold rounded-xl"
              >
                <ExternalLink className="w-4 h-4" /> Open Resource
              </a>
            </div>
          )}

          {(resource.file_type === 'ppt' || resource.file_type === 'pptx' || resource.file_type === 'doc' || resource.file_type === 'docx' || resource.file_type === 'image' || resource.file_type === 'other') && (
            <div className="glass rounded-2xl border border-white/8 p-8 text-center">
              {resource.thumbnail_url ? (
                <img src={resource.thumbnail_url} alt={resource.title} className="max-h-80 mx-auto rounded-lg mb-4" />
              ) : (
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              )}
              <p className="text-gray-400 text-sm mb-4">
                This {resource.file_type.toUpperCase()} file is available for download.
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white text-sm font-semibold rounded-xl"
              >
                <Download className="w-4 h-4" /> Download {resource.file_type.toUpperCase()}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass rounded-2xl border border-white/8 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Resource Info</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Folder className="w-3.5 h-3.5" /> Category</span>
                <Link href={`/learning-hub?category=${resource.category?.slug}`} className="text-brand-blue hover:text-blue-300">
                  {resource.category?.name || 'Uncategorized'}
                </Link>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Type</span>
                <span className="text-white uppercase text-xs font-semibold">{resource.file_type}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> Views</span>
                <span className="text-white">{resource.view_count}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Download className="w-3.5 h-3.5" /> Downloads</span>
                <span className="text-white">{resource.download_count}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Added</span>
                <span className="text-white text-xs">{new Date(resource.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {resource.file_url && (
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 btn-gradient text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90"
              >
                <Download className="w-4 h-4" /> Download Resource
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
