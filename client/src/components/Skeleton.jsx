// Shared skeleton loading blocks, replacing plain "Loading…" text on data-heavy
// views. Uses the .skeleton shimmer utility defined once in index.css.

export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white border border-ink-200 rounded-xl p-5">
      <SkeletonBlock className="h-4 w-24 mb-3" />
      <SkeletonBlock className="h-7 w-20" />
    </div>
  );
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <tr className="border-b border-ink-50 last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBlock className="h-4 w-full max-w-[140px]" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white border border-ink-200 rounded-xl p-6">
      <SkeletonBlock className="h-4 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3.5 w-full" />
        ))}
      </div>
    </div>
  );
}
