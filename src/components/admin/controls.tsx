"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import type { FormState } from "@/server/admin/form-state";
import { inputCls } from "./ui";
import { useToast } from "./Toast";

/** Search box + optional selects that write to the URL query string. */
export function ListToolbar({
  placeholder,
  filters = [],
}: {
  placeholder: string;
  filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const push = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="flex flex-wrap gap-3 border-b border-line p-4">
      <label className="relative min-w-56 flex-1">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-body" />
        <input
          type="search"
          value={q}
          placeholder={placeholder}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => push({ q: value.trim() }), 350);
          }}
          className={`${inputCls} pl-10`}
        />
      </label>
      {filters.map((f) => (
        <label key={f.name} className="w-full sm:w-auto">
          <span className="sr-only">{f.label}</span>
          <select
            value={params.get(f.name) ?? ""}
            onChange={(e) => push({ [f.name]: e.target.value })}
            className={`${inputCls} cursor-pointer sm:w-48`}
          >
            <option value="">{f.label}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

/** Runs a server action from a button, with optional confirm() and a toast for the result. */
export function ActionButton({
  action,
  confirmText,
  className,
  children,
  label,
}: {
  action: () => Promise<FormState | void>;
  confirmText?: string;
  className?: string;
  children: React.ReactNode;
  label?: string;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={pending}
      className={className}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        start(async () => {
          const result = await action();
          if (result?.message) toast(result.ok, result.message);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}

/**
 * useActionState + onSubmit (instead of <form action>), so React doesn't reset the form after submit —
 * edit forms keep the saved values and invalid input isn't wiped. Also toasts the result message.
 */
export function useFormAction<S extends { message?: string; ok?: boolean } | null>(
  action: (prev: S, formData: FormData) => Promise<S>,
  initial: S,
  { toast = true }: { toast?: boolean } = {},
) {
  const [state, dispatch, pending] = useActionState<S, FormData>(
    action as (prev: Awaited<S>, formData: FormData) => Promise<S>,
    initial as Awaited<S>,
  );
  const show = useToast();
  const last = useRef(state);
  useEffect(() => {
    if (toast && state && state !== last.current && state.message) show(state.ok ?? false, state.message);
    last.current = state;
  }, [state, show, toast]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  };
  return { state, onSubmit, pending };
}
