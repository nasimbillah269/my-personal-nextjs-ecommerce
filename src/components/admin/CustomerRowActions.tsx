"use client";

import { useState, useTransition } from "react";
import { Ban, CheckCircle2, KeyRound, Loader2, Trash2, X } from "lucide-react";
import { deleteCustomer, setCustomerActive, setCustomerPassword } from "@/server/admin/user-actions";
import { ActionButton } from "./controls";
import { inputCls } from "./ui";
import { useToast } from "./Toast";

const iconBtn = "grid size-8 place-items-center rounded-lg text-body transition hover:bg-soft hover:text-brand disabled:opacity-50";

export function CustomerRowActions({ id, name, isActive }: { id: number; name: string; isActive: boolean }) {
  const [pwOpen, setPwOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();

  return (
    <div className="relative flex items-center justify-end gap-1">
      <button type="button" onClick={() => setPwOpen((o) => !o)} aria-label={`Set a new password for ${name}`} title="Set new password" className={iconBtn}>
        <KeyRound className="size-4" />
      </button>
      <ActionButton
        action={() => setCustomerActive(id, !isActive)}
        confirmText={isActive ? `Block ${name}? They’ll be logged out and can’t log in.` : undefined}
        label={isActive ? `Block ${name}` : `Unblock ${name}`}
        className={`${iconBtn} ${isActive ? "hover:bg-amber-50! hover:text-amber-600!" : "text-emerald-600"}`}
      >
        {isActive ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
      </ActionButton>
      <ActionButton
        action={() => deleteCustomer(id)}
        confirmText={`Delete ${name}’s account? Their past orders are kept.`}
        label={`Delete ${name}`}
        className={`${iconBtn} hover:bg-red-50! hover:text-red-500!`}
      >
        <Trash2 className="size-4" />
      </ActionButton>

      {pwOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const result = await setCustomerPassword(id, password);
              toast(result?.ok ?? false, result?.message ?? "");
              if (result?.ok) {
                setPassword("");
                setPwOpen(false);
              }
            });
          }}
          className="absolute top-10 right-0 z-20 w-72 rounded-xl border border-line bg-surface p-3 text-left shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-heading">New password for {name.split(/\s+/)[0]}</p>
            <button type="button" onClick={() => setPwOpen(false)} aria-label="Close" className="text-body hover:text-heading">
              <X className="size-4" />
            </button>
          </div>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="off"
            placeholder="8+ letters & numbers"
            aria-label="New password"
            className={`${inputCls} h-10`}
          />
          <button
            type="submit"
            disabled={pending || password.length < 8}
            className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {pending && <Loader2 className="size-4 animate-spin" />} Set password
          </button>
        </form>
      )}
    </div>
  );
}
