"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Pencil, Plus, Save, ShieldCheck, Trash2, Users } from "lucide-react";
import { ADMIN_PERMISSIONS } from "@/lib/constants";
import type { FormState } from "@/server/admin/form-state";
import { deleteRole, saveRole } from "@/server/admin/user-actions";
import { ActionButton, useFormAction } from "./controls";
import { btnPrimary, btnSecondary, Card, Field, inputCls } from "./ui";

export type RoleRow = { id: number; name: string; description: string; permissions: string[]; isSystem: boolean; adminCount: number };

function RoleForm({ role, onDone }: { role: RoleRow | null; onDone: () => void }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveRole, null);
  const errors = state?.errors ?? {};
  const [picked, setPicked] = useState<string[]>(role?.permissions ?? []);
  const all = picked.length === ADMIN_PERMISSIONS.length;

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {role && <input type="hidden" name="id" value={role.id} />}
      <Field label="Role name" htmlFor="role-name" error={errors.name}>
        <input id="role-name" name="name" defaultValue={role?.name ?? ""} aria-invalid={!!errors.name} className={inputCls} placeholder="e.g. Order Manager" />
      </Field>
      <Field label="Description (optional)" htmlFor="role-desc" error={errors.description}>
        <input id="role-desc" name="description" defaultValue={role?.description ?? ""} className={inputCls} placeholder="What this role is for" />
      </Field>
      <fieldset>
        <div className="mb-2 flex items-center justify-between">
          <legend className="text-sm font-bold text-heading">Permissions</legend>
          <button type="button" onClick={() => setPicked(all ? [] : ADMIN_PERMISSIONS.map((p) => p.key))} className="text-xs font-bold text-brand hover:underline">
            {all ? "Clear all" : "Select all"}
          </button>
        </div>
        <ul className="divide-y divide-line rounded-xl border border-line">
          {ADMIN_PERMISSIONS.map((p) => (
            <li key={p.key}>
              <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-soft/60">
                <input
                  type="checkbox"
                  name="permissions"
                  value={p.key}
                  checked={picked.includes(p.key)}
                  onChange={(e) => setPicked((cur) => (e.target.checked ? [...cur, p.key] : cur.filter((k) => k !== p.key)))}
                  className="mt-0.5 size-4 shrink-0 accent-brand"
                />
                <span>
                  <span className="block text-sm font-semibold text-heading">{p.label}</span>
                  <span className="text-xs text-body">{p.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-body">Everyone can see the dashboard and edit their own profile.</p>
      </fieldset>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${btnPrimary} flex-1`}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {role ? "Save role" : "Create role"}
        </button>
        {role && (
          <button type="button" onClick={onDone} className={btnSecondary}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function RolesManager({ roles }: { roles: RoleRow[] }) {
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [formKey, setFormKey] = useState(0);
  const reset = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };
  const labelOf = (key: string) => ADMIN_PERMISSIONS.find((p) => p.key === key)?.label ?? key;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="grid content-start gap-4 md:grid-cols-2">
        {roles.map((r) => {
          const full = r.permissions.includes("*");
          return (
            <Card key={r.id} className={editing?.id === r.id ? "ring-2 ring-brand" : ""}>
              <div className="flex items-start gap-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${full ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>
                  <ShieldCheck className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-bold text-heading">
                    {r.name}
                    {r.isSystem && <Lock className="size-3.5 text-body" aria-label="Built-in role" />}
                  </p>
                  <p className="mt-0.5 text-xs text-body">{r.description || "No description"}</p>
                </div>
                {!r.isSystem && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(r);
                        setFormKey((k) => k + 1);
                      }}
                      aria-label={`Edit ${r.name}`}
                      className="grid size-8 place-items-center rounded-lg text-body hover:bg-soft hover:text-brand"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <ActionButton
                      action={async () => {
                        const result = await deleteRole(r.id);
                        if (result?.ok && editing?.id === r.id) reset();
                        return result;
                      }}
                      confirmText={`Delete role “${r.name}”?`}
                      label={`Delete ${r.name}`}
                      className="grid size-8 place-items-center rounded-lg text-body hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-4" />
                    </ActionButton>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {full ? (
                  <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700">Everything</span>
                ) : r.permissions.length ? (
                  r.permissions.map((p) => (
                    <span key={p} className="rounded-md bg-soft px-2 py-0.5 text-[11px] font-semibold text-heading">
                      {labelOf(p)}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-amber-600">No permissions — dashboard only</span>
                )}
              </div>
              <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-xs text-body">
                <Users className="size-3.5" /> {r.adminCount} admin{r.adminCount === 1 ? "" : "s"}
              </p>
            </Card>
          );
        })}
      </div>

      <Card
        title={editing ? `Edit “${editing.name}”` : "Create role"}
        action={
          editing && (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-bold text-brand">
              <Plus className="size-3.5" /> New
            </button>
          )
        }
        className="self-start xl:sticky xl:top-24"
      >
        <RoleForm key={formKey} role={editing} onDone={reset} />
      </Card>
    </div>
  );
}
