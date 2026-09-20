'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, Eye, FileText, Search, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const fetchArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*, categories(name, color)')
      .order('created_at', { ascending: false })
      .limit(100);
    setArticles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const deleteArticle = async (id: string) => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    setDeleting(id);
    await supabase.from('articles').delete().eq('id', id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
  };

  const approveArticle = async (id: string) => {
    setApproving(id);
    await supabase.from('articles').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', id);
    setArticles((prev) => prev.map((a) => a.id === id ? { ...a, status: 'published' } : a));
    setApproving(null);
  };

  const pendingReview = articles.filter((a) => a.status === 'pending_review');
  const filtered = articles.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Articles</h1>
          <p className="text-gray-500 text-sm">{articles.length} total{pendingReview.length > 0 && <span className="text-yellow-400 ml-1">· {pendingReview.length} pending review</span>}</p>
        </div>
        <Link href="/admin/articles/new" className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm">
          <Plus className="w-4 h-4" /> New Article
        </Link>
      </div>

      {/* Pending review banner */}
      {pendingReview.length > 0 && (
        <div className="glass rounded-xl p-4 mb-5 border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">{pendingReview.length} article{pendingReview.length > 1 ? 's' : ''} waiting for your approval</span>
          </div>
          <div className="space-y-2">
            {pendingReview.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-brand-800/60 rounded-lg px-4 py-2.5">
                <span className="text-sm text-white truncate flex-1 mr-4">{a.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/articles/${a.id}/edit`} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5">Review</Link>
                  <button
                    onClick={() => approveArticle(a.id)}
                    disabled={approving === a.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" /> {approving === a.id ? 'Publishing...' : 'Approve & Publish'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full bg-brand-800 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 max-w-sm"
        />
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Views</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500">No articles found.</td>
              </tr>
            ) : filtered.map((article) => {
              const cat = article.categories;
              return (
                <tr key={article.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <FileText className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-white line-clamp-1 font-medium">{article.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {article.created_at ? formatDistanceToNow(new Date(article.created_at), { addSuffix: true }) : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {cat && (
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: cat.color || '#4a6cf7' }}>
                        {cat.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      article.status === 'published' ? 'bg-green-500/15 text-green-400'
                      : article.status === 'pending_review' ? 'bg-yellow-500/15 text-yellow-400'
                      : 'bg-gray-500/15 text-gray-400'
                    }`}>
                      {article.status === 'pending_review' ? 'Pending Review' : article.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {formatCount(article.view_count)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/blog/${article.slug}`}
                        target="_blank"
                        className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => deleteArticle(article.id)}
                        disabled={deleting === article.id}
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
