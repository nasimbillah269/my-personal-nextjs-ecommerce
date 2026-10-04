/** Building blocks for loading states. Server-safe (no hooks). */

export function Sk({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

/** Wraps a skeleton so screen readers announce that content is loading. */
export function LoadingRegion({
  label = "Loading…",
  className = "",
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Text-like lines; the last one is shorter, like a real paragraph. */
export function SkLines({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <Sk key={i} className={`h-3 ${i === count - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-3 sm:p-4">
      <Sk className="aspect-square w-full rounded-xl" />
      <Sk className="mt-4 h-3.5 w-11/12" />
      <Sk className="mt-2 h-3.5 w-2/3" />
      <div className="mt-auto flex items-center justify-between pt-5">
        <Sk className="h-5 w-16" />
        <Sk className="h-7 w-14 rounded-md" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
