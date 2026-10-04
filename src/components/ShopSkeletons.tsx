import { container } from "@/lib/ui";
import { LoadingRegion, ProductGridSkeleton, Sk, SkLines } from "./Skeleton";

/* Each skeleton mirrors its page's real layout so nothing jumps when data arrives. */

function ShopMain({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <main className={`${container} flex-1 pt-4 lg:pt-6`}>
      <LoadingRegion label={label}>{children}</LoadingRegion>
    </main>
  );
}

function SectionTitle() {
  return <Sk className="mb-4 h-7 w-56 sm:mb-6 lg:h-8" />;
}

function BannerSkeleton({ steps = false }: { steps?: boolean }) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-soft px-6 py-8 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-10">
      <div className="space-y-3">
        <Sk className="h-8 w-56 bg-white sm:h-10 sm:w-72" />
        <Sk className="h-3 w-32 bg-white" />
        <Sk className="h-3 w-48 bg-white" />
      </div>
      {steps && (
        <div className="flex w-full max-w-xl items-center gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`flex items-center gap-3 ${i < 2 ? "flex-1" : ""}`}>
              <Sk className="size-10 shrink-0 rounded-full bg-white sm:size-12" />
              {i < 2 && <Sk className="h-1 flex-1 bg-white" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Home ---------- */

export function HomeSkeleton() {
  return (
    <ShopMain label="Loading store…">
      <Sk className="h-[190px] w-full rounded-2xl sm:h-[320px] lg:h-[520px]" />

      <section className="mt-8 lg:mt-12">
        <SectionTitle />
        <div className="flex gap-3 overflow-hidden sm:gap-4 lg:gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex shrink-0 basis-[calc((100%-1.5rem)/2.6)] flex-col items-center gap-3 rounded-xl bg-soft px-2 py-6 sm:basis-[calc((100%-3rem)/4)] sm:py-8 lg:basis-[calc((100%-7.5rem)/6)]"
            >
              <Sk className="size-9 rounded-full bg-white" />
              <Sk className="h-3 w-20 bg-white" />
              <Sk className="h-2.5 w-14 bg-white" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 lg:mt-14">
        <SectionTitle />
        <ProductGridSkeleton count={8} />
      </section>
    </ShopMain>
  );
}

/* ---------- Product listing ---------- */

function FilterCardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <Sk className="mb-5 h-5 w-32" />
      <div className="space-y-3.5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Sk className="size-4 rounded" />
            <Sk className="h-3.5 flex-1" />
            <Sk className="h-4 w-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListingSkeleton({ standalone = true }: { standalone?: boolean }) {
  const body = (
    <>
      <div className="rounded-2xl bg-soft px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
        <Sk className="h-8 w-52 bg-white sm:h-10" />
        <Sk className="mt-3 h-3 w-28 bg-white" />
        <div className="mt-5 flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }, (_, i) => (
            <Sk key={i} className="h-7 w-24 shrink-0 rounded-full bg-white" />
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-10">
        <div className="hidden space-y-6 lg:block">
          <FilterCardSkeleton rows={8} />
          <FilterCardSkeleton rows={3} />
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Sk className="h-4 w-48" />
            <div className="flex w-full gap-2 sm:w-auto">
              <Sk className="h-10 w-24 rounded-lg lg:hidden" />
              <Sk className="h-10 flex-1 rounded-lg sm:w-56 sm:flex-none" />
            </div>
          </div>
          <ProductGridSkeleton
            count={12}
            className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 xl:gap-5"
          />
        </div>
      </div>
    </>
  );
  return standalone ? <ShopMain label="Loading products…">{body}</ShopMain> : <LoadingRegion label="Loading products…">{body}</LoadingRegion>;
}

/* ---------- Product detail ---------- */

export function ProductPageSkeleton() {
  return (
    <ShopMain label="Loading product…">
      <Sk className="mb-6 h-3 w-64 lg:mb-10" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14 xl:gap-20">
        <div>
          <Sk className="aspect-square w-full rounded-2xl" />
          <div className="mt-8 flex gap-2">
            {[0, 1, 2].map((i) => (
              <Sk key={i} className="size-8 rounded" />
            ))}
          </div>
        </div>
        <div className="lg:pt-4">
          <Sk className="h-8 w-4/5" />
          <Sk className="mt-4 h-9 w-40" />
          <SkLines count={4} className="mt-6" />
          <div className="mt-7 flex gap-2">
            <Sk className="h-8 w-20 rounded-md" />
            <Sk className="h-8 w-20 rounded-md" />
          </div>
          <Sk className="mt-7 h-3 w-44" />
          <Sk className="mt-4 h-9 w-28 rounded-md" />
          <div className="mt-5 flex gap-3">
            <Sk className="h-11 flex-1 rounded-md sm:w-40 sm:flex-none" />
            <Sk className="h-11 flex-1 rounded-md sm:w-36 sm:flex-none" />
            <Sk className="size-11 rounded-full" />
          </div>
          <SkLines count={3} className="mt-8 max-w-xs" />
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-line p-5 sm:p-8 lg:mt-14 lg:p-12">
        <div className="flex gap-2">
          <Sk className="h-9 w-28 rounded-full" />
          <Sk className="h-9 w-32 rounded-full" />
        </div>
        <Sk className="mt-8 h-5 w-48" />
        <SkLines count={3} className="mt-3" />
        <Sk className="mt-8 h-5 w-56" />
        <SkLines count={4} className="mt-3" />
      </div>

      <section className="mt-12 lg:mt-16">
        <SectionTitle />
        <ProductGridSkeleton count={4} />
      </section>
    </ShopMain>
  );
}

/* ---------- Cart / checkout / success ---------- */

function SummaryCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-white p-6">
        <Sk className="h-5 w-36" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex justify-between">
              <Sk className="h-3.5 w-28" />
              <Sk className="h-3.5 w-16" />
            </div>
          ))}
        </div>
        <Sk className="mt-6 h-11 w-full rounded-lg" />
        <div className="mt-6 flex items-end justify-between border-t border-dashed border-line pt-5">
          <Sk className="h-4 w-24" />
          <Sk className="h-7 w-24" />
        </div>
        <Sk className="mt-5 h-12 w-full rounded-full" />
      </div>
      <Sk className="h-32 w-full rounded-2xl" />
    </div>
  );
}

export function CartSkeleton({ standalone = true }: { standalone?: boolean }) {
  const body = (
    <>
      <BannerSkeleton steps />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_410px] xl:gap-10">
        <div className="space-y-5">
          <Sk className="h-[74px] w-full rounded-xl" />
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 md:px-6">
                <Sk className="size-20 shrink-0 rounded-xl sm:size-24" />
                <div className="flex-1 space-y-2.5">
                  <Sk className="h-4 w-3/5" />
                  <Sk className="h-3 w-20" />
                </div>
                <Sk className="hidden h-9 w-28 rounded-lg md:block" />
                <Sk className="hidden h-5 w-16 md:block" />
              </div>
            ))}
          </div>
        </div>
        <SummaryCardSkeleton />
      </div>
    </>
  );
  return standalone ? <ShopMain label="Loading your cart…">{body}</ShopMain> : <LoadingRegion label="Loading your cart…">{body}</LoadingRegion>;
}

export function CheckoutSkeleton({ standalone = true }: { standalone?: boolean }) {
  const body = (
    <>
      <BannerSkeleton steps />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-10">
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-7">
            <Sk className="mb-6 h-6 w-52" />
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={i === 2 || i === 5 ? "sm:col-span-2" : ""}>
                  <Sk className="mb-2 h-3.5 w-24" />
                  <Sk className={`w-full rounded-lg ${i === 5 ? "h-24" : "h-12"}`} />
                </div>
              ))}
            </div>
          </div>
          {[2, 4].map((n) => (
            <div key={n} className="rounded-2xl border border-line bg-white p-5 sm:p-7">
              <Sk className="mb-6 h-6 w-44" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: n }, (_, i) => (
                  <Sk key={i} className="h-[74px] rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <SummaryCardSkeleton rows={4} />
      </div>
    </>
  );
  return standalone ? <ShopMain label="Loading checkout…">{body}</ShopMain> : <LoadingRegion label="Loading checkout…">{body}</LoadingRegion>;
}

export function OrderSuccessSkeleton() {
  return (
    <ShopMain label="Loading your order…">
      <BannerSkeleton steps />
      <div className="mt-8 flex flex-col items-center rounded-2xl border border-line bg-white px-6 py-10 lg:py-14">
        <Sk className="size-24 rounded-full" />
        <Sk className="mt-6 h-8 w-72" />
        <Sk className="mt-3 h-4 w-56" />
        <Sk className="mt-8 h-20 w-full max-w-3xl rounded-xl" />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Sk className="h-80 rounded-2xl" />
        <div className="space-y-6">
          <Sk className="h-56 rounded-2xl" />
          <Sk className="h-64 rounded-2xl" />
        </div>
      </div>
    </ShopMain>
  );
}
