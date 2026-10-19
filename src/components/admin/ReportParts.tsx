import Link from "next/link";
import { FileSpreadsheet, Filter } from "lucide-react";
import { orderStatusMeta, paymentMethods } from "@/lib/checkout";
import { ORDER_STATUSES } from "@/lib/constants";
import { filtersToQuery, formatRange, statusFilterLabel, type ReportFilters } from "@/server/admin/reports";
import { PrintButton } from "./PrintButton";
import { btnPrimary, btnSecondary, inputCls } from "./ui";

export type ReportKind = "sales" | "products" | "customers";

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Quick ranges, computed in Dhaka time. */
function presets() {
  const now = Date.now() + 6 * 3_600_000;
  const today = iso(now);
  const d = new Date(now);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return [
    { label: "Today", from: today, to: today },
    { label: "Last 7 days", from: iso(now - 6 * DAY), to: today },
    { label: "Last 30 days", from: iso(now - 29 * DAY), to: today },
    { label: "This month", from: iso(Date.UTC(y, m, 1)), to: today },
    { label: "Last month", from: iso(Date.UTC(y, m - 1, 1)), to: iso(Date.UTC(y, m, 0)) },
    { label: "This year", from: `${y}-01-01`, to: today },
  ];
}

/** Plain GET form: the filters live in the URL, so a report can be bookmarked or shared. */
export function ReportToolbar({
  kind,
  filters: f,
  categories,
  searchPlaceholder,
}: {
  kind: ReportKind;
  filters: ReportFilters;
  categories?: { id: number; name: string }[];
  searchPlaceholder?: string;
}) {
  const base = `/admin/reports/${kind}`;
  const query = filtersToQuery(f);
  const keep = (from: string, to: string) => {
    const p = new URLSearchParams(query);
    p.set("from", from);
    p.set("to", to);
    return `${base}?${p}`;
  };

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-4 print:hidden">
      <form method="get" action={base} className="flex flex-wrap items-end gap-3">
        <label className="w-full sm:w-40">
          <span className="mb-1 block text-xs font-bold text-body">From</span>
          <input type="date" name="from" defaultValue={f.from} max={f.to} className={inputCls} />
        </label>
        <label className="w-full sm:w-40">
          <span className="mb-1 block text-xs font-bold text-body">To</span>
          <input type="date" name="to" defaultValue={f.to} className={inputCls} />
        </label>
        <label className="w-full sm:w-48">
          <span className="mb-1 block text-xs font-bold text-body">Order status</span>
          <select name="status" defaultValue={f.status} className={`${inputCls} cursor-pointer`}>
            <option value="">All except cancelled</option>
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusMeta[s]?.label ?? s}
              </option>
            ))}
          </select>
        </label>
        <label className="w-full sm:w-44">
          <span className="mb-1 block text-xs font-bold text-body">Payment</span>
          <select name="payment" defaultValue={f.payment} className={`${inputCls} cursor-pointer`}>
            <option value="">All methods</option>
            {paymentMethods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        {kind === "sales" && (
          <label className="w-full sm:w-36">
            <span className="mb-1 block text-xs font-bold text-body">Group by</span>
            <select name="group" defaultValue={f.group} className={`${inputCls} cursor-pointer`}>
              <option value="day">Day</option>
              <option value="month">Month</option>
            </select>
          </label>
        )}
        {kind === "products" && categories && (
          <label className="w-full sm:w-48">
            <span className="mb-1 block text-xs font-bold text-body">Category</span>
            <select name="category" defaultValue={f.category ?? ""} className={`${inputCls} cursor-pointer`}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {searchPlaceholder && (
          <label className="w-full min-w-48 flex-1">
            <span className="mb-1 block text-xs font-bold text-body">Search</span>
            <input type="search" name="q" defaultValue={f.q} placeholder={searchPlaceholder} className={inputCls} />
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={`${btnPrimary} h-11`}>
            <Filter className="size-4" /> Apply
          </button>
          <Link href={base} className={`${btnSecondary} h-11`}>
            Reset
          </Link>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap gap-1.5">
          {presets().map((p) => {
            const active = p.from === f.from && p.to === f.to;
            return (
              <Link
                key={p.label}
                href={keep(p.from, p.to)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  active ? "bg-brand text-white" : "bg-soft text-body hover:bg-brand-light hover:text-brand"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
        <div className="flex gap-2">
          <PrintButton />
          {/* A plain link: the route streams the .xlsx file as a download. */}
          <a href={`${base}/export?${query}`} className={`${btnSecondary} border-emerald-300 text-emerald-700`}>
            <FileSpreadsheet className="size-4" /> Export Excel
          </a>
        </div>
      </div>
    </div>
  );
}

/** Title block shown only on paper. */
export function PrintHeader({ title, filters: f, storeName, extra }: { title: string; filters: ReportFilters; storeName: string; extra?: string[] }) {
  const generated = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });
  return (
    <div className="mb-6 hidden border-b-2 border-heading pb-3 print:block">
      <p className="text-sm font-bold tracking-wide text-body uppercase">{storeName}</p>
      <h1 className="text-2xl font-bold text-heading">{title}</h1>
      <p className="mt-1 text-sm text-heading">
        {formatRange(f)} · {statusFilterLabel(f.status)}
        {f.payment && ` · ${paymentMethods.find((m) => m.id === f.payment)?.label}`}
        {extra?.map((e) => ` · ${e}`)}
      </p>
      <p className="text-xs text-body">Generated {generated}</p>
    </div>
  );
}

export function StatGrid({ stats }: { stats: { label: string; value: string; hint?: string }[] }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6 print:grid-cols-3 print:gap-2">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 print:rounded-lg print:p-2.5">
          <p className="text-xs font-bold tracking-wide text-body uppercase">{s.label}</p>
          <p className="mt-1 text-xl font-bold text-heading print:text-base">{s.value}</p>
          {s.hint && <p className="mt-0.5 text-xs text-body">{s.hint}</p>}
        </div>
      ))}
    </div>
  );
}

/** Table classes shared by the reports (compact on paper). */
export const reportTable = "w-full text-sm print:text-[11px]";
export const reportHead = "bg-soft text-left text-xs font-bold tracking-wide text-body uppercase print:text-[10px]";
export const th = "px-4 py-3 print:px-2 print:py-1.5";
export const td = "px-4 py-2.5 print:px-2 print:py-1";
