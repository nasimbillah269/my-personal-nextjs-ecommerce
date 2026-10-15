import { exportSubscribers } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

/** Quotes a CSV cell; a leading =, +, - or @ is defused so spreadsheets don't run it as a formula. */
const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  await requireAdmin("subscribers");
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  const rows = await exportSubscribers(status);

  const lines = [
    ["Email", "Name", "Status", "Source", "Joined (UTC)"].map(cell).join(","),
    ...rows.map((r) => [r.email, r.name, r.status, r.source, r.createdAt.toISOString().slice(0, 19).replace("T", " ")].map(cell).join(",")),
  ];
  const date = new Date().toISOString().slice(0, 10);
  // BOM so Excel opens the UTF-8 file with the right encoding.
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${status ?? "all"}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
