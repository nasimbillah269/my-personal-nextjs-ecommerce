"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { divisions } from "@/lib/checkout";
import { changePassword, updateProfile } from "@/server/account-actions";
import type { FormState } from "@/server/admin/form-state";

const inputCls =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-brand focus:ring-4 focus:ring-brand-light";

function Field({ name, label, error, children }: { name: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`pf-${name}`} className="mb-1.5 block text-sm font-bold text-heading">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}

const border = (error?: string) => (error ? "border-red-400" : "border-line");

function useSubmit(action: (prev: FormState, data: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(action, null);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  return { state, errors: state?.errors ?? {}, pending, onSubmit };
}

function Result({ state }: { state: FormState }) {
  if (!state?.message) return null;
  return (
    <p role="status" className={`flex items-center gap-1.5 text-sm font-semibold ${state.ok ? "text-leaf" : "text-red-500"}`}>
      {state.ok && <CheckCircle2 className="size-4" />} {state.message}
    </p>
  );
}

const saveBtn =
  "inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60";

export function ProfileForm({
  initial,
}: {
  initial: { name: string; phone: string; email: string | null; division: string; area: string; address: string };
}) {
  const { state, errors, pending, onSubmit } = useSubmit(updateProfile);
  return (
    <form onSubmit={onSubmit} className="space-y-5 p-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Full name" error={errors.name}>
          <input id="pf-name" name="name" defaultValue={initial.name} autoComplete="name" className={`${inputCls} ${border(errors.name)}`} />
        </Field>
        <Field name="phone" label="Mobile number" error={errors.phone}>
          <input id="pf-phone" name="phone" defaultValue={initial.phone} inputMode="tel" autoComplete="tel" className={`${inputCls} ${border(errors.phone)}`} />
        </Field>
        <Field name="email" label="Email (optional)" error={errors.email}>
          <input id="pf-email" name="email" type="email" defaultValue={initial.email ?? ""} autoComplete="email" className={`${inputCls} ${border(errors.email)}`} />
        </Field>
        <Field name="division" label="Division" error={errors.division}>
          <select id="pf-division" name="division" defaultValue={initial.division} className={`${inputCls} cursor-pointer ${border(errors.division)}`}>
            <option value="">Select division</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field name="area" label="Area / Thana" error={errors.area}>
          <input id="pf-area" name="area" defaultValue={initial.area} placeholder="e.g. Dhanmondi" className={`${inputCls} ${border(errors.area)}`} />
        </Field>
        <Field name="address" label="Full address" error={errors.address}>
          <input
            id="pf-address"
            name="address"
            defaultValue={initial.address}
            autoComplete="street-address"
            placeholder="House, road, landmark"
            className={`${inputCls} ${border(errors.address)}`}
          />
        </Field>
      </div>
      <p className="text-xs text-body">Your address is filled in automatically at checkout.</p>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={saveBtn}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save profile
        </button>
        <Result state={state} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const { state, errors, pending, onSubmit } = useSubmit(changePassword);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} onSubmit={onSubmit} className="space-y-5 p-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="current" label="Current password" error={errors.current}>
          <input id="pf-current" name="current" type="password" autoComplete="current-password" className={`${inputCls} ${border(errors.current)}`} />
        </Field>
        <Field name="password" label="New password" error={errors.password}>
          <input
            id="pf-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="8+ letters & numbers"
            className={`${inputCls} ${border(errors.password)}`}
          />
        </Field>
        <Field name="confirm" label="Confirm new password" error={errors.confirm}>
          <input id="pf-confirm" name="confirm" type="password" autoComplete="new-password" className={`${inputCls} ${border(errors.confirm)}`} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={saveBtn}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Change password
        </button>
        <Result state={state} />
      </div>
    </form>
  );
}
