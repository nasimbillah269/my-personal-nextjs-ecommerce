"use client";

import { useEffect, useRef, useState } from "react";
import { formatTaka } from "./ui";

type Point = { date: string; revenue: number; orders: number };

const HEIGHT = 260;
const PAD = { top: 24, right: 8, bottom: 28, left: 56 };
const BAR_MAX = 24;

function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1000, 2000, 3000, 4000];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n));

const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

/** Single-series column chart: daily revenue for the last 30 days, with hover tooltip and a table view. */
export function RevenueChart({ data }: { data: Point[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ticks = niceTicks(Math.max(...data.map((d) => d.revenue)));
  const yMax = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.max(2, Math.min(BAR_MAX, band - 2)); // keep ≥2px surface gap between columns
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;
  const peak = data.reduce((best, d, i) => (d.revenue > data[best].revenue ? i : best), 0);
  const labelEvery = width < 520 ? 7 : 5;

  const barPath = (x: number, top: number, w: number, h: number) => {
    const r = Math.min(4, h, w / 2);
    const base = top + h;
    return `M${x},${base}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${base}Z`;
  };

  const hovered = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setShowTable((s) => !s)}
          className="rounded-md px-2 py-1 text-xs font-bold text-brand hover:bg-brand-light"
          aria-pressed={showTable}
        >
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-[260px] overflow-y-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-soft text-left text-xs text-body uppercase">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 text-right">Orders</th>
                <th className="px-3 py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.date} className="border-t border-line">
                  <td className="px-3 py-2 text-heading">{dayLabel(d.date, { weekday: "short", day: "numeric", month: "short" })}</td>
                  <td className="px-3 py-2 text-right text-heading tabular-nums">{d.orders}</td>
                  <td className="px-3 py-2 text-right font-semibold text-heading tabular-nums">{formatTaka(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrap} className="relative" style={{ height: HEIGHT }} onMouseLeave={() => setHover(null)}>
          {width > 0 && (
            <svg width={width} height={HEIGHT} role="img" aria-label="Daily revenue for the last 30 days">
              <defs>
                <linearGradient id="revenue-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#13a2a8" />
                </linearGradient>
              </defs>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#eef1f5" strokeWidth={1} strokeDasharray="3 4" />
                  <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-body text-[11px] tabular-nums">
                    ৳{compact(t)}
                  </text>
                </g>
              ))}

              {data.map((d, i) => {
                const x = PAD.left + i * band + (band - barW) / 2;
                const h = Math.max(0, PAD.top + plotH - y(d.revenue));
                return (
                  <g key={d.date}>
                    {h > 0 && (
                      <path
                        d={barPath(x, y(d.revenue), barW, h)}
                        fill="url(#revenue-bar)"
                        opacity={hover === null || hover === i ? 1 : 0.35}
                        className="transition-opacity"
                      />
                    )}
                    {i % labelEvery === (data.length - 1) % labelEvery && (
                      <text x={x + barW / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-body text-[11px]">
                        {dayLabel(d.date, { day: "numeric", month: "short" })}
                      </text>
                    )}
                    {/* Full-height hit target, wider than the mark */}
                    <rect
                      x={PAD.left + i * band}
                      y={PAD.top}
                      width={band}
                      height={plotH}
                      fill="transparent"
                      onMouseEnter={() => setHover(i)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      tabIndex={0}
                      aria-label={`${dayLabel(d.date, { day: "numeric", month: "short" })}: ${formatTaka(d.revenue)}, ${d.orders} orders`}
                    />
                  </g>
                );
              })}

              {/* Label only the peak day */}
              {data[peak]?.revenue > 0 && hover === null && (
                <text
                  x={PAD.left + peak * band + band / 2}
                  y={y(data[peak].revenue) - 8}
                  textAnchor="middle"
                  className="fill-heading text-[11px] font-bold"
                >
                  {formatTaka(data[peak].revenue)}
                </text>
              )}
              <line x1={PAD.left} x2={width - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="#d9dde3" strokeWidth={1} />
            </svg>
          )}

          {hovered && hover !== null && (
            <div
              className="pointer-events-none absolute z-10 w-44 -translate-x-1/2 rounded-lg border border-line bg-white px-3 py-2 shadow-lg"
              style={{
                left: Math.min(Math.max(PAD.left + hover * band + band / 2, 90), width - 90),
                top: Math.max(0, y(hovered.revenue) - 74),
              }}
            >
              <p className="text-xs font-semibold text-body">
                {dayLabel(hovered.date, { weekday: "short", day: "numeric", month: "short" })}
              </p>
              <p className="mt-0.5 text-sm font-bold text-heading tabular-nums">{formatTaka(hovered.revenue)}</p>
              <p className="text-xs text-body">
                {hovered.orders} order{hovered.orders === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
