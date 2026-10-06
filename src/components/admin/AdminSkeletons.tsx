import { LoadingRegion, Sk, SkLines } from "../Skeleton";

/* Loading states for admin pages — each mirrors the real page layout. */

function HeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2.5">
        <Sk className="h-7 w-48" />
        <Sk className="h-3.5 w-72 max-w-full" />
      </div>
      {action && <Sk className="h-10 w-36 rounded-lg" />}
    </div>
  );
}

function CardSkeleton({ className = "", title = true, children }: { className?: string; title?: boolean; children: React.ReactNode }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-line bg-surface ${className}`}>
      {title && (
        <div className="border-b border-line px-5 py-4">
          <Sk className="h-5 w-40" />
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function TableRows({ rows = 8, thumb = false, cols = 5 }: { rows?: number; thumb?: boolean; cols?: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-6 px-5 py-4">
          <div className="flex min-w-0 flex-[2] items-center gap-3">
            {thumb && <Sk className="size-12 shrink-0 rounded-lg" />}
            <div className="flex-1 space-y-2">
              <Sk className="h-3.5 w-3/4 max-w-56" />
              <Sk className="h-2.5 w-1/2 max-w-32" />
            </div>
          </div>
          {Array.from({ length: cols - 1 }, (_, j) => (
            <Sk key={j} className={`hidden h-3.5 flex-1 sm:block ${j === cols - 2 ? "max-w-16" : "max-w-24"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- Dashboard ---------- */

export function DashboardSkeleton() {
  return (
    <LoadingRegion label="Loading dashboard…">
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-start justify-between">
              <Sk className="h-3.5 w-24" />
              <Sk className="size-10 rounded-xl" />
            </div>
            <Sk className="mt-3 h-7 w-28" />
            <Sk className="mt-3 h-3 w-40" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CardSkeleton>
          {/* Column-chart silhouette */}
          <div className="flex h-[260px] items-end gap-1.5 pt-10 pl-12">
            {[35, 60, 20, 45, 70, 30, 55, 80, 40, 25, 65, 50, 30, 75, 45, 20, 60, 35, 85, 50, 30, 55, 40, 70, 25, 45, 60, 35, 50, 65].map(
              (h, i) => (
                <Sk key={i} className="flex-1 rounded-t-sm rounded-b-none" style={{ height: `${h}%` }} />
              ),
            )}
          </div>
        </CardSkeleton>
        <CardSkeleton>
          <div className="space-y-5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Sk className="h-3.5 w-24" />
                  <Sk className="h-3.5 w-6" />
                </div>
                <Sk className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardSkeleton>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="border-b border-line px-5 py-4">
            <Sk className="h-5 w-36" />
          </div>
          <TableRows rows={7} cols={5} />
        </div>
        <div className="space-y-6">
          <CardSkeleton>
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Sk className="size-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Sk className="h-3 w-4/5" />
                    <Sk className="h-2.5 w-12" />
                  </div>
                  <Sk className="h-3.5 w-14" />
                </div>
              ))}
            </div>
          </CardSkeleton>
          <CardSkeleton>
            <SkLines count={2} />
          </CardSkeleton>
        </div>
      </div>
    </LoadingRegion>
  );
}

/* ---------- List pages (orders, products, customers) ---------- */

export function TablePageSkeleton({
  label,
  tabs = false,
  filters = 1,
  thumb = false,
  cols = 6,
  action = false,
}: {
  label: string;
  tabs?: boolean;
  filters?: number;
  thumb?: boolean;
  cols?: number;
  action?: boolean;
}) {
  return (
    <LoadingRegion label={label}>
      <HeaderSkeleton action={action} />
      {tabs && (
        <div className="mb-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }, (_, i) => (
            <Sk key={i} className="h-9 w-28 shrink-0 rounded-full bg-surface" />
          ))}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <Sk className="h-11 min-w-56 flex-1 rounded-lg" />
          {Array.from({ length: filters }, (_, i) => (
            <Sk key={i} className="h-11 w-full rounded-lg sm:w-48" />
          ))}
        </div>
        <div className="bg-soft px-5 py-3.5">
          <Sk className="h-3 w-1/3 bg-surface" />
        </div>
        <TableRows rows={8} thumb={thumb} cols={cols} />
        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <Sk className="h-3.5 w-40" />
          <Sk className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </LoadingRegion>
  );
}

/* ---------- Order detail ---------- */

export function OrderDetailSkeleton() {
  return (
    <LoadingRegion label="Loading order…">
      <Sk className="mb-5 h-4 w-24" />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex gap-3">
            <Sk className="h-8 w-44" />
            <Sk className="h-7 w-20 rounded-full" />
          </div>
          <Sk className="h-3.5 w-48" />
        </div>
        <div className="flex gap-2">
          <Sk className="h-10 w-32 rounded-lg" />
          <Sk className="h-10 w-24 rounded-lg" />
        </div>
      </div>
      <CardSkeleton title={false} className="mb-6">
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex items-center gap-2 ${i < 4 ? "flex-1" : ""}`}>
              <Sk className="size-9 shrink-0 rounded-full" />
              {i < 4 && <Sk className="h-1 flex-1" />}
            </div>
          ))}
        </div>
      </CardSkeleton>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="border-b border-line px-5 py-4">
            <Sk className="h-5 w-24" />
          </div>
          <TableRows rows={3} thumb cols={2} />
          <div className="space-y-3 border-t border-line p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex justify-between">
                <Sk className="h-3.5 w-28" />
                <Sk className="h-3.5 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <CardSkeleton>
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <Sk className="mb-2 h-3.5 w-24" />
                  <Sk className={`w-full rounded-lg ${i === 2 ? "h-20" : "h-11"}`} />
                </div>
              ))}
              <Sk className="h-10 w-full rounded-lg" />
            </div>
          </CardSkeleton>
          <CardSkeleton>
            <SkLines count={3} />
          </CardSkeleton>
        </div>
      </div>
    </LoadingRegion>
  );
}

/* ---------- Product form ---------- */

function FieldSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div>
      <Sk className="mb-2 h-3.5 w-28" />
      <Sk className={`w-full rounded-lg ${tall ? "h-28" : "h-11"}`} />
    </div>
  );
}

export function ProductFormSkeleton() {
  return (
    <LoadingRegion label="Loading product…">
      <HeaderSkeleton action />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <CardSkeleton>
            <div className="space-y-5">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton tall />
            </div>
          </CardSkeleton>
          <CardSkeleton>
            <Sk className="h-72 w-full rounded-lg" />
          </CardSkeleton>
          <CardSkeleton>
            <div className="space-y-3">
              <Sk className="h-11 w-full rounded-lg" />
              <Sk className="h-11 w-full rounded-lg" />
            </div>
          </CardSkeleton>
        </div>
        <div className="space-y-6">
          <CardSkeleton>
            <div className="space-y-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <SkLines count={2} className="flex-1" />
                  <Sk className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </CardSkeleton>
          <CardSkeleton>
            <div className="space-y-4">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </CardSkeleton>
          <CardSkeleton>
            <div className="flex gap-4">
              <Sk className="size-24 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Sk className="h-10 w-full rounded-lg" />
                <Sk className="h-3 w-3/4" />
              </div>
            </div>
          </CardSkeleton>
        </div>
      </div>
    </LoadingRegion>
  );
}

/* ---------- List + side form (categories, coupons) ---------- */

export function ManagerSkeleton({ label, thumb = false }: { label: string; thumb?: boolean }) {
  return (
    <LoadingRegion label={label}>
      <HeaderSkeleton />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="bg-soft px-5 py-3.5">
            <Sk className="h-3 w-1/3 bg-surface" />
          </div>
          <TableRows rows={6} thumb={thumb} cols={5} />
        </div>
        <CardSkeleton className="self-start">
          <div className="space-y-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton tall />
            <Sk className="h-10 w-full rounded-lg" />
          </div>
        </CardSkeleton>
      </div>
    </LoadingRegion>
  );
}

/* ---------- Settings ---------- */

export function SettingsSkeleton() {
  return (
    <LoadingRegion label="Loading settings…">
      <HeaderSkeleton />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <CardSkeleton key={i}>
              <div className="grid gap-5 sm:grid-cols-2">
                {[0, 1, 2, 3].map((j) => (
                  <FieldSkeleton key={j} />
                ))}
              </div>
            </CardSkeleton>
          ))}
        </div>
        <div className="space-y-6">
          <CardSkeleton>
            <div className="space-y-4">
              <FieldSkeleton />
              <FieldSkeleton />
              <Sk className="h-10 w-32 rounded-lg" />
            </div>
          </CardSkeleton>
          <CardSkeleton>
            <div className="space-y-4">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </CardSkeleton>
        </div>
      </div>
    </LoadingRegion>
  );
}
