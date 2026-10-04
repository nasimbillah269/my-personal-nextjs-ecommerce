import type { z } from "zod";

/** Return shape for every admin form action (works with React's useActionState). */
export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  id?: number;
} | null;

/** First error message per field, keyed by top-level field name. */
export function firstErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
