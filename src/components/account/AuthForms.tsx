"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, LogIn, Mail, Phone, User, UserPlus } from "lucide-react";
import { customerLogin, register } from "@/server/account-actions";
import type { FormState } from "@/server/admin/form-state";

const inputBase =
  "h-12 w-full rounded-xl border bg-white pr-4 pl-11 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-brand focus:ring-4 focus:ring-brand-light";

function Input({
  name,
  label,
  icon: Icon,
  error,
  type = "text",
  ...rest
}: {
  name: string;
  label: string;
  icon: typeof Mail;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label htmlFor={`auth-${name}`} className="mb-1.5 block text-sm font-bold text-heading">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-body" />
        <input
          id={`auth-${name}`}
          name={name}
          type={isPassword && show ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error ? `auth-${name}-error` : undefined}
          className={`${inputBase} ${isPassword ? "pr-12" : ""} ${error ? "border-red-400" : "border-line"}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-body transition hover:text-brand"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`auth-${name}-error`} className="mt-1.5 text-xs font-semibold text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

/** useActionState submitted from onSubmit, so React doesn't clear the fields when validation fails. */
function useAuthAction(action: (prev: FormState, data: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(action, null);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  return { state, errors: state?.errors ?? {}, pending, onSubmit };
}

function FormError({ state }: { state: FormState }) {
  if (!state || state.ok || state.errors) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
      <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.message}
    </p>
  );
}

const submitCls =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand to-brand-dark text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 disabled:opacity-60";

export function LoginForm({ next }: { next?: string }) {
  const { state, errors, pending, onSubmit } = useAuthAction(customerLogin);
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FormError state={state} />
      <Input name="login" label="Mobile number or email" icon={User} error={errors.login} autoComplete="username" placeholder="01XXXXXXXXX" autoFocus />
      <Input name="password" label="Password" icon={Lock} type="password" error={errors.password} autoComplete="current-password" placeholder="Your password" />
      <button type="submit" disabled={pending} className={submitCls}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />} Log in
      </button>
      <p className="text-center text-sm text-body">
        New here?{" "}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-bold text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { state, errors, pending, onSubmit } = useAuthAction(register);
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FormError state={state} />
      <Input name="name" label="Full name" icon={User} error={errors.name} autoComplete="name" placeholder="Your name" autoFocus />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="phone" label="Mobile number" icon={Phone} error={errors.phone} autoComplete="tel" inputMode="tel" placeholder="01XXXXXXXXX" />
        <Input name="email" label="Email (optional)" icon={Mail} type="email" error={errors.email} autoComplete="email" placeholder="you@example.com" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="password" label="Password" icon={Lock} type="password" error={errors.password} autoComplete="new-password" placeholder="8+ letters & numbers" />
        <Input name="confirm" label="Confirm password" icon={Lock} type="password" error={errors.confirm} autoComplete="new-password" placeholder="Type it again" />
      </div>
      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-body">
          <input type="checkbox" name="agree" className="mt-0.5 size-4 shrink-0 accent-brand" aria-invalid={!!errors.agree} />
          <span>I agree to the store’s terms and privacy policy.</span>
        </label>
        {errors.agree && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.agree}</p>}
      </div>
      <button type="submit" disabled={pending} className={submitCls}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Create account
      </button>
      <p className="text-center text-sm text-body">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-bold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
