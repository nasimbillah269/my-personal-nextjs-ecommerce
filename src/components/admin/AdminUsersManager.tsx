"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Save, ShieldCheck, Trash2, UserCog } from "lucide-react";
import type { FormState } from "@/server/admin/form-state";
import { deleteAdmin, saveAdmin } from "@/server/admin/user-actions";
import { ActionButton, Toggle, useFormAction } from "./controls";
import { btnPrimary, btnSecondary, Card, EmptyState, Field, formatDateTime, inputCls } from "./ui";

export type AdminRow = {
  id: number;
  name: string;
  email: string;
  roleId: number | null;
  roleName: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function AdminForm({ admin, roles, isSelf, onDone }: { admin: AdminRow | null; roles: { id: number; name: string }[]; isSelf: boolean; onDone: () => void }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveAdmin, null);
  const errors = state?.errors ?? {};
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {admin && <input type="hidden" name="id" value={admin.id} />}
      <Field label="Full name" htmlFor="adm-name" error={errors.name}>
        <input id="adm-name" name="name" defaultValue={admin?.name ?? ""} aria-invalid={!!errors.name} className={inputCls} placeholder="e.g. Rahim Uddin" />
      </Field>
      <Field label="Email (login)" htmlFor="adm-email" error={errors.email}>
        <input id="adm-email" name="email" type="email" defaultValue={admin?.email ?? ""} aria-invalid={!!errors.email} className={inputCls} autoComplete="off" />
      </Field>
      <Field label="Role" htmlFor="adm-role" error={errors.roleId} hint="Decides which sections they can open.">
        <select id="adm-role" name="roleId" defaultValue={admin?.roleId ?? ""} aria-invalid={!!errors.roleId} className={`${inputCls} cursor-pointer`}>
          <option value="">Choose a role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label={admin ? "New password (optional)" : "Password"}
        htmlFor="adm-password"
        error={errors.password}
        hint={admin ? "Leave empty to keep their current password." : "8+ characters with letters and numbers."}
      >
        <div className="relative">
          <input
            id="adm-password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            className={`${inputCls} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-body hover:text-brand"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <div className="-my-1 border-y border-line">
        <Toggle
          name="isActive"
          label="Active"
          hint={isSelf ? "You can’t deactivate yourself." : "Inactive admins can’t log in."}
          defaultChecked={admin?.isActive ?? true}
        />
      </div>
      {errors.isActive && <p className="text-xs font-semibold text-red-500">{errors.isActive}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${btnPrimary} flex-1`}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {admin ? "Save admin" : "Add admin"}
        </button>
        {admin && (
          <button type="button" onClick={onDone} className={btnSecondary}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function AdminUsersManager({ admins, roles, meId }: { admins: AdminRow[]; roles: { id: number; name: string }[]; meId: number }) {
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [formKey, setFormKey] = useState(0);
  const reset = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card bodyClassName="">
        {admins.length === 0 ? (
          <EmptyState icon={UserCog} title="No admins" />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="px-5 py-3">Admin</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Last login</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className={`border-t border-line ${editing?.id === a.id ? "bg-brand-light/40" : "hover:bg-soft/60"}`}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-emerald-500 text-xs font-bold text-white">
                          {initials(a.name) || "?"}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-bold text-heading">
                            {a.name}
                            {a.id === meId && <span className="rounded bg-brand-light px-1.5 text-[11px] font-bold text-brand-dark">You</span>}
                          </span>
                          <span className="block truncate text-xs text-body">{a.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {a.roleName ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            a.isSuperAdmin ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {a.isSuperAdmin && <ShieldCheck className="size-3.5" />}
                          {a.roleName}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600">No role</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-body">{a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Never"}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(a);
                            setFormKey((k) => k + 1);
                          }}
                          aria-label={`Edit ${a.name}`}
                          className="grid size-8 place-items-center rounded-lg text-body hover:bg-soft hover:text-brand"
                        >
                          <Pencil className="size-4" />
                        </button>
                        {a.id !== meId && (
                          <ActionButton
                            action={async () => {
                              const result = await deleteAdmin(a.id);
                              if (result?.ok && editing?.id === a.id) reset();
                              return result;
                            }}
                            confirmText={`Delete admin “${a.name}”? They lose access immediately.`}
                            label={`Delete ${a.name}`}
                            className="grid size-8 place-items-center rounded-lg text-body hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="size-4" />
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title={editing ? `Edit “${editing.name}”` : "Add admin"}
        action={
          editing && (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-bold text-brand">
              <Plus className="size-3.5" /> New
            </button>
          )
        }
        className="self-start xl:sticky xl:top-24"
      >
        <AdminForm key={formKey} admin={editing} roles={roles} isSelf={editing?.id === meId} onDone={reset} />
      </Card>
    </div>
  );
}
