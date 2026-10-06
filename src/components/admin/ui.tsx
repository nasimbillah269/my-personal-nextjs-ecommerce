import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { orderStatusMeta, paymentMethods, paymentStatusMeta } from "@/lib/checkout";

/* ---------- Shared class names ---------- */

export const inputCls =
  "h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-brand focus:ring-4 focus:ring-brand-light aria-invalid:border-red-400";
export const labelCls = "mb-1.5 block text-sm font-bold text-heading";
export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-brand to-emerald-500 px-4 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:shadow-lg hover:shadow-brand/30 hover:brightness-105 disabled:opacity-60";
export const btnSecondary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-bold text-heading transition hover:border-brand hover:text-brand disabled:opacity-60";
export const btnDanger =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60";

/* ---------- Layout ---------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-heading">{title}</h1>
        {description && <p className="mt-1 text-sm text-body">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  action,
  className = "",
  bodyClassName = "p-5",
  children,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.10)] ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-heading">{title}</h2>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  error,
  hint,
  className = "",
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-body">{hint}</p>
      )}
    </div>
  );
}

/* ---------- Badges ---------- */

export function StatusBadge({ status }: { status: string }) {
  const meta = orderStatusMeta[status] ?? { label: status, className: "bg-soft text-body" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const meta = paymentStatusMeta[status] ?? { label: status, className: "bg-soft text-body" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>;
}

export function PaymentMethodLabel({ method }: { method: string }) {
  const m = paymentMethods.find((p) => p.id === method);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading">
      <span className="size-2 rounded-full" style={{ background: m?.color ?? "#999" }} aria-hidden="true" />
      {m?.short ?? method}
    </span>
  );
}

export function Thumb({
  emoji,
  tint,
  image,
  name,
  size = "md",
}: {
  emoji: string;
  tint: string;
  image?: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-9 text-lg" : "size-12 text-2xl";
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-lg ${box}`} style={{ background: tint }}>
      {image ? (
        <Image src={image} alt={name} fill sizes="48px" className="object-cover" />
      ) : (
        <span role="img" aria-label={name}>
          {emoji}
        </span>
      )}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: typeof ChevronLeft; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-brand-light">
        <Icon className="size-8 text-brand" strokeWidth={1.5} />
      </span>
      <p className="mt-4 font-bold text-heading">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-body">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Pagination (link based, keeps other query params) ---------- */

export function Pagination({
  page,
  total,
  pageSize,
  basePath,
  params,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") q.set(k, v);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = "grid size-9 place-items-center rounded-lg border border-line bg-white text-heading transition hover:border-brand hover:text-brand";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-body">
      <p>
        Showing <b className="text-heading">{from}</b>–<b className="text-heading">{to}</b> of{" "}
        <b className="text-heading">{total}</b>
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={href(page - 1)} aria-label="Previous page" className={btn}>
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span className={`${btn} pointer-events-none opacity-40`}>
              <ChevronLeft className="size-4" />
            </span>
          )}
          <span className="px-2 font-semibold text-heading">
            {page} / {pages}
          </span>
          {page < pages ? (
            <Link href={href(page + 1)} aria-label="Next page" className={btn}>
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className={`${btn} pointer-events-none opacity-40`}>
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Formatting ---------- */

export const formatDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });

export const formatDateTime = (d: Date | string) =>
  new Date(d).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });

export const formatTaka = (n: number) => `৳${n.toLocaleString("en-IN")}`;
