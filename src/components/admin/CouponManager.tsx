"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Save, TicketPercent, Trash2 } from "lucide-react";
import { deleteCoupon, saveCoupon, setCouponActive } from "@/server/admin/catalog-actions";
import type { FormState } from "@/server/admin/form-state";
import { ActionButton, useFormAction } from "./controls";
import { btnPrimary, btnSecondary, Card, EmptyState, Field, formatDate, formatTaka, inputCls } from "./ui";

export type CouponRow = {
  id: number;
  code: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
};

function CouponForm({ coupon, onDone }: { coupon: CouponRow | null; onDone: () => void }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveCoupon, null);
  const errors = state?.errors ?? {};
  const [type, setType] = useState<"percent" | "flat">(coupon?.type ?? "percent");

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <Field label="Code" htmlFor="code" error={errors.code} hint="Customers type this at checkout.">
        <input
          id="code"
          name="code"
          defaultValue={coupon?.code}
          aria-invalid={!!errors.code}
          className={`${inputCls} font-mono uppercase`}
          placeholder="e.g. EID20"
        />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-bold text-heading">Discount type</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["percent", "Percentage %"],
              ["flat", "Fixed amount ৳"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-line px-3 py-2.5 text-sm font-semibold text-heading has-checked:border-brand has-checked:bg-brand-light/50"
            >
              <input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} className="accent-brand" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <Field label={type === "percent" ? "Percent off" : "Amount off (৳)"} htmlFor="value" error={errors.value}>
          <input id="value" name="value" type="number" min={1} defaultValue={coupon?.value} aria-invalid={!!errors.value} className={inputCls} />
        </Field>
        <Field label="Min. order (৳)" htmlFor="minOrder" error={errors.minOrder}>
          <input id="minOrder" name="minOrder" type="number" min={0} defaultValue={coupon?.minOrder ?? 0} className={inputCls} />
        </Field>
        <Field label="Usage limit" htmlFor="usageLimit" hint="Empty = unlimited" error={errors.usageLimit}>
          <input id="usageLimit" name="usageLimit" type="number" min={1} defaultValue={coupon?.usageLimit ?? ""} className={inputCls} />
        </Field>
        <Field label="Expires on" htmlFor="expiresAt" hint="Empty = never" error={errors.expiresAt}>
          <input id="expiresAt" name="expiresAt" type="date" defaultValue={coupon?.expiresAt?.slice(0, 10) ?? ""} className={inputCls} />
        </Field>
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-heading">
        <input type="checkbox" name="isActive" defaultChecked={coupon?.isActive ?? true} className="size-4 accent-brand" />
        Active
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${btnPrimary} flex-1`}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {coupon ? "Save coupon" : "Create coupon"}
        </button>
        {coupon && (
          <button type="button" onClick={onDone} className={btnSecondary}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function couponState(c: CouponRow) {
  if (!c.isActive) return { label: "Paused", cls: "bg-slate-100 text-slate-600" };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { label: "Expired", cls: "bg-rose-100 text-rose-700" };
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return { label: "Used up", cls: "bg-amber-100 text-amber-700" };
  return { label: "Active", cls: "bg-emerald-100 text-emerald-700" };
}

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const [editing, setEditing] = useState<CouponRow | null>(null);
  const [formKey, setFormKey] = useState(0);
  const reset = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card bodyClassName="">
        {coupons.length === 0 ? (
          <EmptyState icon={TicketPercent} title="No coupons yet" text="Create a discount code with the form." />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Discount</th>
                  <th className="px-5 py-3">Usage</th>
                  <th className="px-5 py-3">Expires</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const s = couponState(c);
                  return (
                    <tr key={c.id} className={`border-t border-line ${editing?.id === c.id ? "bg-brand-light/40" : "hover:bg-soft/60"}`}>
                      <td className="px-5 py-3">
                        <span className="rounded-md border border-dashed border-brand bg-brand-light/50 px-2 py-1 font-mono text-xs font-bold text-brand-dark">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-heading">{c.type === "percent" ? `${c.value}% off` : `${formatTaka(c.value)} off`}</p>
                        <p className="text-xs text-body">{c.minOrder ? `Min. order ${formatTaka(c.minOrder)}` : "No minimum"}</p>
                      </td>
                      <td className="px-5 py-3 text-heading tabular-nums">
                        {c.usedCount}
                        <span className="text-body"> / {c.usageLimit ?? "∞"}</span>
                      </td>
                      <td className="px-5 py-3 text-heading">{c.expiresAt ? formatDate(c.expiresAt) : <span className="text-body">Never</span>}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            action={() => setCouponActive(c.id, !c.isActive)}
                            className="rounded-lg px-2 py-1 text-xs font-bold text-brand hover:bg-brand-light"
                          >
                            {c.isActive ? "Pause" : "Activate"}
                          </ActionButton>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(c);
                              setFormKey((k) => k + 1);
                            }}
                            aria-label={`Edit ${c.code}`}
                            className="grid size-8 place-items-center rounded-lg text-body hover:bg-soft hover:text-brand"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <ActionButton
                            action={() => deleteCoupon(c.id)}
                            confirmText={`Delete coupon ${c.code}?`}
                            label={`Delete ${c.code}`}
                            className="grid size-8 place-items-center rounded-lg text-body hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="size-4" />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title={editing ? `Edit ${editing.code}` : "Create coupon"}
        action={
          editing && (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-bold text-brand">
              <Plus className="size-3.5" /> New
            </button>
          )
        }
        className="self-start xl:sticky xl:top-24"
      >
        <CouponForm key={formKey} coupon={editing} onDone={reset} />
      </Card>
    </div>
  );
}
