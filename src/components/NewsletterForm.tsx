"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { FormState } from "@/server/admin/form-state";
import { subscribe } from "@/server/newsletter-actions";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <div className="mt-6 max-w-md">
      <form ref={form} action={action} className="flex overflow-hidden rounded-full bg-white shadow-sm">
        {/* Honeypot for bots — hidden from people and screen readers. */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <input
          type="email"
          name="email"
          required
          aria-label="Your email address"
          placeholder="Your email address"
          className="min-w-0 flex-1 px-5 py-3 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-70 sm:px-8"
        >
          {pending && <Loader2 className="size-4 animate-spin" />} Subscribe
        </button>
      </form>
      {state?.message && (
        <p role="status" className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${state.ok ? "text-brand-dark" : "text-red-600"}`}>
          {state.ok && <CheckCircle2 className="size-4" />} {state.message}
        </p>
      )}
    </div>
  );
}
