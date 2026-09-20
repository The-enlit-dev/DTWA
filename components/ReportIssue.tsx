'use client';

import { Flag, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

const REPORT_TYPES = [
  'Incorrect information',
  'Broken link',
  'Outdated information',
  'Typo',
  'Other',
] as const;

interface ReportIssueProps {
  contentType: string;
  contentId: string;
  contentSlug: string;
}

export default function ReportIssue({ contentType, contentId, contentSlug }: ReportIssueProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<string>(REPORT_TYPES[0]);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('content_reports').insert({
        content_type: contentType,
        content_id: contentId,
        content_slug: contentSlug,
        report_type: reportType,
        description: description || null,
        reporter_email: email || null,
        status: 'open',
      });

      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setSuccess(false);
    setError('');
    setDescription('');
    setEmail('');
    setReportType(REPORT_TYPES[0]);
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm"
      >
        <Flag className="w-3.5 h-3.5" />
        Report an issue
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="glass rounded-2xl p-6 w-full max-w-md border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {success ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">Thank you!</h3>
                <p className="text-sm text-gray-400 mb-5">We&apos;ll review this.</p>
                <button
                  onClick={handleClose}
                  className="btn-gradient px-5 py-2.5 text-white font-medium rounded-xl text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-brand-blue" />
                    <h3 className="font-display font-bold text-lg text-white">Report an issue</h3>
                  </div>
                  <button onClick={handleClose} className="text-gray-500 hover:text-gray-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Report type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className={inputClass}
                    >
                      {REPORT_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-brand-800">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Description <span className="text-gray-600">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Tell us more about the issue..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Email <span className="text-gray-600">(optional, for follow-up)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 btn-gradient px-4 py-2.5 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
