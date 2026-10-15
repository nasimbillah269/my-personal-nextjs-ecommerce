"use client";

import { useEffect, useRef } from "react";
import { Loader2, Plus, Trash2, UserMinus, UserPlus } from "lucide-react";
import type { FormState } from "@/server/admin/form-state";
import { addSubscriber, deleteSubscriber, setSubscriberStatus } from "@/server/admin/user-actions";
import { ActionButton, useFormAction } from "./controls";
import { btnPrimary, Field, inputCls } from "./ui";

export function AddSubscriberForm() {
  const { state, onSubmit, pending } = useFormAction<FormState>(addSubscriber, null);
  const errors = state?.errors ?? {};
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="sub-email" error={errors.email}>
        <input id="sub-email" name="email" type="email" aria-invalid={!!errors.email} className={inputCls} placeholder="name@example.com" />
      </Field>
      <Field label="Name (optional)" htmlFor="sub-name" error={errors.name}>
        <input id="sub-name" name="name" className={inputCls} />
      </Field>
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add subscriber
      </button>
    </form>
  );
}

const iconBtn = "grid size-8 place-items-center rounded-lg text-body transition hover:bg-soft hover:text-brand disabled:opacity-50";

export function SubscriberRowActions({ id, email, subscribed }: { id: number; email: string; subscribed: boolean }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ActionButton
        action={() => setSubscriberStatus(id, subscribed ? "unsubscribed" : "subscribed")}
        label={subscribed ? `Unsubscribe ${email}` : `Re-subscribe ${email}`}
        className={iconBtn}
      >
        {subscribed ? <UserMinus className="size-4" /> : <UserPlus className="size-4" />}
      </ActionButton>
      <ActionButton
        action={() => deleteSubscriber(id)}
        confirmText={`Remove ${email} from the list?`}
        label={`Delete ${email}`}
        className={`${iconBtn} hover:bg-red-50! hover:text-red-500!`}
      >
        <Trash2 className="size-4" />
      </ActionButton>
    </div>
  );
}
