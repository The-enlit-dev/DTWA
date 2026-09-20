'use client';

import { BookOpen, FileText, Cpu, Compass, AlertCircle, RotateCcw } from 'lucide-react';

const shimmer = 'animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]';

// ============================================
// BASE SKELETON PRIMITIVES
// ============================================

export function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`${shimmer} rounded-lg ${className}`} />;
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

// ============================================
// PAGE-LEVEL SKELETONS
// ============================================

export function HomepageSkeleton() {
  return (
    <div className="min-h-screen bg-brand-900 space-y-16">
      {/* Hero */}
      <div className="px-4 pt-20 pb-12 max-w-7xl mx-auto">
        <SkeletonBox className="h-6 w-32 mb-4" />
        <SkeletonBox className="h-12 w-3/4 mb-3" />
        <SkeletonBox className="h-12 w-1/2 mb-6" />
        <SkeletonText lines={2} className="max-w-xl" />
        <div className="flex gap-3 mt-6">
          <SkeletonBox className="h-10 w-36 rounded-xl" />
          <SkeletonBox className="h-10 w-36 rounded-xl" />
        </div>
      </div>
      {/* Featured article */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="glass rounded-2xl p-6 flex gap-6">
          <SkeletonBox className="w-full h-64 rounded-xl" />
          <div className="flex-1 space-y-3">
            <SkeletonBox className="h-5 w-24" />
            <SkeletonBox className="h-7 w-3/4" />
            <SkeletonText lines={4} />
            <div className="flex gap-2">
              <SkeletonBox className="h-8 w-24 rounded-lg" />
              <SkeletonBox className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4">
        <SkeletonBox className="h-8 w-48 mb-6" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 space-y-3">
              <SkeletonBox className="h-32 w-full rounded-lg" />
              <SkeletonBox className="h-5 w-3/4" />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <SkeletonBox className="h-5 w-24" />
      <SkeletonBox className="h-10 w-full" />
      <SkeletonBox className="h-10 w-2/3" />
      <div className="flex items-center gap-3">
        <SkeletonBox className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-3 w-16" />
        </div>
      </div>
      <SkeletonBox className="w-full h-64 rounded-xl" />
      <SkeletonText lines={8} />
      <SkeletonText lines={6} />
      <SkeletonText lines={4} />
    </article>
  );
}

export function BlogListSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
      <SkeletonBox className="h-10 w-64" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 space-y-3">
            <SkeletonBox className="h-40 w-full rounded-lg" />
            <SkeletonBox className="h-5 w-20" />
            <SkeletonBox className="h-6 w-3/4" />
            <SkeletonText lines={2} />
            <div className="flex gap-2">
              <SkeletonBox className="h-7 w-16 rounded-full" />
              <SkeletonBox className="h-7 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ToolCardSkeleton() {
  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonBox className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-5 w-3/4" />
          <SkeletonBox className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <SkeletonBox className="h-6 w-16 rounded-full" />
        <SkeletonBox className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function ToolDirectorySkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
      <SkeletonBox className="h-10 w-48" />
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBox key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <ToolCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function GlossarySkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
      <SkeletonBox className="h-10 w-48" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="glass rounded-xl p-5 space-y-3">
          <SkeletonBox className="h-6 w-1/3" />
          <SkeletonText lines={3} />
          <div className="flex gap-2">
            <SkeletonBox className="h-6 w-16 rounded-full" />
            <SkeletonBox className="h-6 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <SkeletonBox className="h-12 w-full rounded-xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass rounded-xl p-4 flex gap-4">
          <SkeletonBox className="w-16 h-16 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-5 w-3/4" />
            <SkeletonText lines={2} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBox className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 space-y-3">
            <SkeletonBox className="h-4 w-20" />
            <SkeletonBox className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-5 space-y-3">
        <SkeletonBox className="h-6 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <SkeletonBox className="h-4 w-1/3" />
            <SkeletonBox className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8">
        <SkeletonBox className="h-5 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-white/4">
          <SkeletonBox className="h-4 flex-1" />
          <SkeletonBox className="h-4 w-20" />
          <SkeletonBox className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-4">
        <SkeletonBox className="w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <SkeletonBox className="h-7 w-48" />
          <SkeletonBox className="h-4 w-32" />
        </div>
      </div>
      <SkeletonText lines={5} />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 space-y-2">
            <SkeletonBox className="h-8 w-12" />
            <SkeletonBox className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComparisonSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <SkeletonBox className="h-10 w-64" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-5 space-y-3">
            <SkeletonBox className="w-16 h-16 rounded-xl" />
            <SkeletonBox className="h-6 w-3/4" />
            <SkeletonText lines={3} />
            <div className="flex gap-2">
              <SkeletonBox className="h-6 w-16 rounded-full" />
              <SkeletonBox className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="glass rounded-xl p-5 space-y-3">
        <SkeletonBox className="h-6 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-3 gap-4 py-2">
            <SkeletonBox className="h-4" />
            <SkeletonBox className="h-4" />
            <SkeletonBox className="h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

export function EmptyState({
  icon: Icon = BookOpen,
  title = 'Nothing here yet',
  description = '',
  actionLabel,
  actionHref,
  onAction,
}: {
  icon?: any;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/8 mb-5">
        <Icon className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="font-display font-bold text-lg text-white mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">{description}</p>}
      {actionLabel && actionHref && (
        <a href={actionHref} className="inline-flex items-center gap-2 btn-gradient px-5 py-2.5 text-white font-medium rounded-xl text-sm">
          {actionLabel}
        </a>
      )}
      {actionLabel && onAction && !actionHref && (
        <button onClick={onAction} className="inline-flex items-center gap-2 btn-gradient px-5 py-2.5 text-white font-medium rounded-xl text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ============================================
// ERROR STATE
// ============================================

export function ErrorState({
  title = 'Something went wrong',
  description = '',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-5">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="font-display font-bold text-lg text-white mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">{description}</p>}
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-2 px-5 py-2.5 glass border border-white/10 text-gray-300 font-medium rounded-xl text-sm hover:border-white/20 transition-all">
          <RotateCcw className="w-4 h-4" /> Retry
        </button>
      )}
    </div>
  );
}

// ============================================
// PAGE WRAPPER with loading/error/empty states
// ============================================

export function AsyncContainer({
  loading,
  error,
  empty,
  skeleton,
  onRetry,
  children,
}: {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  skeleton: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (loading) return <>{skeleton}</>;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (empty) return <EmptyState title="No results found" description="Try adjusting your search or filters." />;
  return <>{children}</>;
}
