"use client";

import { Loader2, Printer, Save, Trash2 } from "lucide-react";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { orderStatusMeta, paymentStatusMeta } from "@/lib/checkout";
import type { FormState } from "@/server/admin/form-state";
import { deleteOrder, updateOrder } from "@/server/admin/order-actions";
import { ActionButton, useFormAction } from "./controls";
import { btnDanger, btnPrimary, btnSecondary, Field, inputCls } from "./ui";

export function OrderUpdateForm({
  id,
  status,
  paymentStatus,
  adminNote,
}: {
  id: number;
  status: string;
  paymentStatus: string;
  adminNote: string;
}) {
  const { onSubmit, pending } = useFormAction<FormState>(updateOrder, null);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <Field label="Order status" htmlFor="status">
        <select id="status" name="status" defaultValue={status} className={`${inputCls} cursor-pointer`}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {orderStatusMeta[s].label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Payment status" htmlFor="paymentStatus">
        <select id="paymentStatus" name="paymentStatus" defaultValue={paymentStatus} className={`${inputCls} cursor-pointer`}>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {paymentStatusMeta[s].label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Internal note" htmlFor="adminNote" hint="Only visible to admins.">
        <textarea
          id="adminNote"
          name="adminNote"
          rows={3}
          defaultValue={adminNote}
          placeholder="e.g. Customer asked for evening delivery"
          className={`${inputCls} h-auto resize-none py-2.5`}
        />
      </Field>
      <p className="text-xs text-body">Cancelling an order puts its items back in stock automatically.</p>
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
      </button>
    </form>
  );
}

export function OrderActions({ id, orderNo }: { id: number; orderNo: string }) {
  return (
    <>
      <button type="button" onClick={() => window.print()} className={btnSecondary}>
        <Printer className="size-4" /> Print invoice
      </button>
      <ActionButton
        action={() => deleteOrder(id)}
        confirmText={`Delete order ${orderNo}? This can’t be undone.`}
        className={btnDanger}
      >
        <Trash2 className="size-4" /> Delete
      </ActionButton>
    </>
  );
}
