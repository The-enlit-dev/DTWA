'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  const fetch = async () => {
    setLoading(true);
    let query = supabase
      .from('comments')
      .select('*, profiles(username, full_name), articles(title, slug)')
      .order('created_at', { ascending: false });

    if (filter === 'pending') query = query.eq('is_approved', false);
    else if (filter === 'approved') query = query.eq('is_approved', true);

    const { data } = await query.limit(100);
    setComments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [filter]);

  const approve = async (id: string) => {
    await supabase.from('comments').update({ is_approved: true }).eq('id', id);
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, is_approved: true } : c));
  };

  const reject = async (id: string) => {
    await supabase.from('comments').delete().eq('id', id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Comments</h1>
          <p className="text-gray-500 text-sm">{comments.length} {filter}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {(['pending', 'approved', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-brand-blue text-white' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 glass rounded-xl">
            <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No {filter} comments.</p>
          </div>
        ) : comments.map((comment) => {
          const author = comment.profiles;
          const article = comment.articles;
          return (
            <div key={comment.id} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-brand-blue">
                    {(author?.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">{author?.full_name || author?.username || 'Anonymous'}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  comment.is_approved ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                }`}>
                  {comment.is_approved ? 'Approved' : 'Pending'}
                </span>
              </div>

              {article && (
                <p className="text-xs text-gray-500 mb-2">
                  On: <span className="text-brand-blue">{article.title}</span>
                </p>
              )}

              <p className="text-sm text-gray-300 mb-3">{comment.content}</p>

              <div className="flex items-center gap-2">
                {!comment.is_approved && (
                  <button
                    onClick={() => approve(comment.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-lg text-xs hover:bg-green-500/25 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                <button
                  onClick={() => reject(comment.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-xs hover:bg-red-500/25 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
