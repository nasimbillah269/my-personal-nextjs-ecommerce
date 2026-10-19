"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, KeyRound, Loader2, Plus, Save, Share2, Trash2 } from "lucide-react";
import {
  MAX_SOCIAL_LINKS,
  SOCIAL_NETWORKS,
  SOCIAL_PROVIDERS,
  socialNetworkLabel,
  type SocialAppSettings,
  type SocialLink,
  type SocialNetwork,
  type SocialProvider,
} from "@/lib/social";
import type { FormState } from "@/server/admin/form-state";
import { saveSocialSettings } from "@/server/admin/settings-actions";
import { SocialIcon } from "../SocialIcons";
import { useFormAction } from "./controls";
import { btnPrimary, btnSecondary, Card, Field, inputCls } from "./ui";

/** Write-only secret box: the saved value is never shown; leave empty to keep it. */
function SecretField({ provider, label, hasSecret, error }: { provider: SocialProvider; label: string; hasSecret: boolean; error?: string }) {
  const name = `${provider}AppSecret`;
  const [clear, setClear] = useState(false);
  const saved = hasSecret && !clear;
  return (
    <Field
      label={`${label} App Secret`}
      htmlFor={name}
      error={error}
      hint={
        saved ? (
          <span>
            A secret is saved. Type a new one to replace it, or{" "}
            <button type="button" onClick={() => setClear(true)} className="font-bold text-red-500 hover:underline">
              remove it
            </button>
            .
          </span>
        ) : clear ? (
          <span>
            The secret will be removed when you save.{" "}
            <button type="button" onClick={() => setClear(false)} className="font-bold text-brand hover:underline">
              Undo
            </button>
          </span>
        ) : undefined
      }
    >
      <input
        id={name}
        name={name}
        type="password"
        autoComplete="new-password"
        placeholder={saved ? "•••••••• (saved)" : `${label} App Secret`}
        aria-invalid={!!error}
        className={inputCls}
      />
      <input type="hidden" name={`clear${name}`} value={clear ? "on" : ""} />
    </Field>
  );
}

type LinkRow = { rowId: number; network: SocialNetwork; label: string; url: string };

const iconBtn =
  "grid size-9 shrink-0 place-items-center rounded-lg border border-line text-body transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-line disabled:hover:text-body";

/** Add / remove / reorder social links; the list is submitted as JSON in one hidden field. */
function SocialLinksEditor({ initial, errors }: { initial: SocialLink[]; errors: Record<string, string> }) {
  const nextId = useRef(initial.length);
  // A label equal to the platform name is shown as the placeholder, so changing the platform updates it.
  const [rows, setRows] = useState<LinkRow[]>(() =>
    initial.map((l, i) => ({ rowId: i, network: l.network, url: l.url, label: l.label === socialNetworkLabel(l.network) ? "" : l.label })),
  );

  const update = (rowId: number, patch: Partial<LinkRow>) => setRows((rs) => rs.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
  const move = (i: number, dir: -1 | 1) =>
    setRows((rs) => {
      const next = [...rs];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  const add = () => {
    const used = new Set(rows.map((r) => r.network));
    const network = SOCIAL_NETWORKS.find((n) => n.network !== "other" && !used.has(n.network))?.network ?? "other";
    setRows((rs) => [...rs, { rowId: nextId.current++, network, label: "", url: "" }]);
  };

  const payload = JSON.stringify(rows.map(({ network, label, url }) => ({ network, label, url })));

  return (
    <Card
      title={<span className="flex items-center gap-2"><Share2 className="size-5 text-brand" /> Social link</span>}
      action={
        <button type="button" onClick={add} disabled={rows.length >= MAX_SOCIAL_LINKS} className={`${btnSecondary} h-9`}>
          <Plus className="size-4" /> Add link
        </button>
      }
    >
      <input type="hidden" name="socialLinks" value={payload} />
      <p className="mb-5 text-sm text-body">Each link shows as an icon in the store footer, in this order. Pick “Custom link” for any other site.</p>
      {errors.socialLinks && <p className="mb-4 text-sm font-semibold text-red-500">{errors.socialLinks}</p>}

      {rows.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-line bg-soft p-8 text-center">
          <p className="text-sm text-body">No social links yet.</p>
          <button type="button" onClick={add} className={btnPrimary}>
            <Plus className="size-4" /> Add your first link
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r, i) => {
            const meta = SOCIAL_NETWORKS.find((n) => n.network === r.network)!;
            const err = (f: string) => errors[`link-${i}-${f}`];
            return (
              <li key={r.rowId} className="rounded-xl border border-line p-3">
                <div className="grid gap-3 md:grid-cols-[180px_200px_minmax(0,1fr)_auto]">
                  <label className="block">
                    <span className="sr-only">Platform</span>
                    <span className="relative block">
                      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand">
                        <SocialIcon network={r.network} />
                      </span>
                      <select
                        value={r.network}
                        onChange={(ev) => update(r.rowId, { network: ev.target.value as SocialNetwork })}
                        className={`${inputCls} cursor-pointer pl-10`}
                      >
                        {SOCIAL_NETWORKS.map((n) => (
                          <option key={n.network} value={n.network}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                  <label className="block">
                    <span className="sr-only">Name</span>
                    <input
                      value={r.label}
                      onChange={(ev) => update(r.rowId, { label: ev.target.value })}
                      maxLength={60}
                      placeholder={r.network === "other" ? "Name, e.g. Daraz Shop" : meta.label}
                      aria-invalid={!!err("label")}
                      className={inputCls}
                    />
                    {err("label") && <span className="mt-1 block text-xs font-semibold text-red-500">{err("label")}</span>}
                  </label>
                  <label className="block">
                    <span className="sr-only">Link</span>
                    <input
                      type="url"
                      value={r.url}
                      onChange={(ev) => update(r.rowId, { url: ev.target.value })}
                      placeholder={meta.placeholder}
                      aria-invalid={!!err("url")}
                      className={inputCls}
                    />
                    {err("url") && <span className="mt-1 block text-xs font-semibold text-red-500">{err("url")}</span>}
                  </label>
                  <div className="flex gap-1.5 md:pt-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" title="Move up" className={iconBtn}>
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === rows.length - 1}
                      aria-label="Move down"
                      title="Move down"
                      className={iconBtn}
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRows((rs) => rs.filter((x) => x.rowId !== r.rowId))}
                      aria-label="Remove link"
                      title="Remove"
                      className={`${iconBtn} hover:border-red-300! hover:text-red-500!`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function SocialSettingsForm({ links, apps }: { links: SocialLink[]; apps: SocialAppSettings }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveSocialSettings, null);
  const e = state?.errors ?? {};
  const form = useRef<HTMLFormElement>(null);

  // Don't leave a just-saved secret sitting in the page.
  useEffect(() => {
    if (state?.ok) form.current?.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((i) => (i.value = ""));
  }, [state]);

  return (
    <form ref={form} onSubmit={onSubmit} noValidate className="space-y-6">
      {state && !state.ok && state.errors && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {state.message}
        </p>
      )}

      <SocialLinksEditor initial={links} errors={e} />

      <Card title={<span className="flex items-center gap-2"><KeyRound className="size-5 text-brand" /> Social integration</span>}>
        <p className="mb-5 text-sm text-body">
          App credentials for social login. Get them from each provider’s developer console; the redirect URL must match the one registered there.
        </p>
        <div className="space-y-6">
          {SOCIAL_PROVIDERS.map(({ provider: p, label }) => (
            <div key={p} className="grid gap-5 lg:grid-cols-3">
              <Field label={`${label} App ID`} htmlFor={`${p}AppId`} error={e[`${p}AppId`]}>
                <input id={`${p}AppId`} name={`${p}AppId`} defaultValue={apps[p].appId} placeholder={`${label} App ID`} autoComplete="off" className={inputCls} />
              </Field>
              {/* Remount when the saved state flips, so a pending "remove" resets after saving. */}
              <SecretField key={String(apps[p].hasSecret)} provider={p} label={label} hasSecret={apps[p].hasSecret} error={e[`${p}AppSecret`]} />
              <Field label={`${label} Redirect URL`} htmlFor={`${p}RedirectUrl`} error={e[`${p}RedirectUrl`]}>
                <input
                  id={`${p}RedirectUrl`}
                  name={`${p}RedirectUrl`}
                  type="url"
                  defaultValue={apps[p].redirectUrl}
                  placeholder={`https://yourstore.com/auth/${p}/callback`}
                  aria-invalid={!!e[`${p}RedirectUrl`]}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </button>
      </div>
    </form>
  );
}
