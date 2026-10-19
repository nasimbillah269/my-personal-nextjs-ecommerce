"use client";

import { useState } from "react";
import { Eye, EyeOff, Info, Loader2, Mail, Save, Send } from "lucide-react";
import type { MailEncryption, MailSettings } from "@/lib/mail";
import type { FormState } from "@/server/admin/form-state";
import { saveMailSettings, sendTestMail } from "@/server/admin/settings-actions";
import { Toggle, useFormAction } from "./controls";
import { btnPrimary, btnSecondary, Card, Field, inputCls } from "./ui";

const selectCls = `${inputCls} cursor-pointer`;
/** Usual port for each encryption, used to update the port box when it still holds another default. */
const defaultPort: Record<MailEncryption, string> = { tls: "587", ssl: "465", none: "25" };

/** Password box with a show/hide eye; the saved password is write-only, so empty means "keep it". */
export function PasswordField({
  name,
  label,
  placeholder,
  hasPassword,
  error,
}: {
  name: string;
  label: string;
  placeholder: string;
  hasPassword: boolean;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  const [clear, setClear] = useState(false);
  const saved = hasPassword && !clear;
  return (
    <Field
      label={label}
      htmlFor={name}
      error={error}
      hint={
        saved ? (
          <span>
            A password is saved. Type a new one to replace it, or{" "}
            <button type="button" onClick={() => setClear(true)} className="font-bold text-red-500 hover:underline">
              remove it
            </button>
            .
          </span>
        ) : clear ? (
          <span>
            The password will be removed when you save.{" "}
            <button type="button" onClick={() => setClear(false)} className="font-bold text-brand hover:underline">
              Undo
            </button>
          </span>
        ) : undefined
      }
    >
      <div className="relative">
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder={saved ? "•••••••• (saved)" : placeholder}
          aria-invalid={!!error}
          className={`${inputCls} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-body hover:text-brand"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <input type="hidden" name={`clear${name[0].toUpperCase()}${name.slice(1)}`} value={clear ? "on" : ""} />
    </Field>
  );
}

function TestMailForm() {
  const { state, onSubmit, pending } = useFormAction<FormState>(sendTestMail, null, { toast: false });
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input
          name="testTo"
          type="email"
          required
          placeholder="you@example.com"
          aria-label="Send a test email to"
          aria-invalid={!!state?.errors?.testTo}
          className={inputCls}
        />
        {state && !state.ok && state.message && <p className="mt-1.5 text-xs font-semibold break-words text-red-500">{state.message}</p>}
        {state?.ok && <p className="mt-1.5 text-xs font-semibold text-emerald-600">{state.message}</p>}
      </div>
      <button type="submit" disabled={pending} className={`${btnSecondary} h-11`}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send test email
      </button>
    </form>
  );
}

const tips = {
  "For Non-SSL": [
    "Select “sendmail” as Mail Driver if you face any issue after configuring “SMTP”",
    "Set Mail Host according to your server’s mail client manual settings",
    "Set Mail Port as 587",
    "Set Mail Encryption as “SSL” if you face issues with “TLS”",
  ],
  "For SSL": [
    "Select “sendmail” as Mail Driver if you face any issue after configuring “SMTP”",
    "Set Mail Host according to your server’s mail client manual settings",
    "Set Mail Port as 465",
    "Set Mail Encryption as “SSL”",
  ],
};

export function MailSettingsForm({ settings }: { settings: MailSettings & { hasPassword: boolean } }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveMailSettings, null);
  const e = state?.errors ?? {};
  const [driver, setDriver] = useState(settings.driver);
  const [port, setPort] = useState(String(settings.port));
  const smtp = driver === "smtp";

  const onEncryption = (enc: MailEncryption) => {
    if (Object.values(defaultPort).includes(port)) setPort(defaultPort[enc]);
  };

  return (
    <div className="space-y-6">
      <Card title={<span className="flex items-center gap-2"><Mail className="size-5 text-brand" /> Mail Setting</span>}>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Mail From Address" htmlFor="mailFromAddress" error={e.mailFromAddress}>
              <input id="mailFromAddress" name="mailFromAddress" type="email" defaultValue={settings.fromAddress} placeholder="info@yourdomain.com" aria-invalid={!!e.mailFromAddress} className={inputCls} />
            </Field>
            <Field label="Mail From Name" htmlFor="mailFromName" error={e.mailFromName}>
              <input id="mailFromName" name="mailFromName" defaultValue={settings.fromName} placeholder="Your store name" aria-invalid={!!e.mailFromName} className={inputCls} />
            </Field>
            <Field label="Mail Driver" htmlFor="mailDriver" error={e.mailDriver}>
              <select id="mailDriver" name="mailDriver" value={driver} onChange={(ev) => setDriver(ev.target.value as typeof driver)} className={selectCls}>
                <option value="smtp">SMTP</option>
                <option value="sendmail">Sendmail</option>
              </select>
            </Field>
            <Field label="Mail Host" htmlFor="mailHost" error={e.mailHost} hint={smtp ? undefined : "Not used with Sendmail."}>
              <input id="mailHost" name="mailHost" defaultValue={settings.host} placeholder="mail.yourdomain.com" readOnly={!smtp} aria-invalid={!!e.mailHost} className={`${inputCls} read-only:opacity-60`} />
            </Field>
            <Field label="Mail Port" htmlFor="mailPort" error={e.mailPort}>
              <input id="mailPort" name="mailPort" type="number" min={1} max={65535} value={port} onChange={(ev) => setPort(ev.target.value)} aria-invalid={!!e.mailPort} className={inputCls} />
            </Field>
            <Field label="Mail Encryption" htmlFor="mailEncryption" error={e.mailEncryption}>
              <select id="mailEncryption" name="mailEncryption" defaultValue={settings.encryption} onChange={(ev) => onEncryption(ev.target.value as MailEncryption)} className={selectCls}>
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">None</option>
              </select>
            </Field>
            <Field label="Mail Username" htmlFor="mailUsername" error={e.mailUsername}>
              <input id="mailUsername" name="mailUsername" defaultValue={settings.username} placeholder="noreply@yourdomain.com" autoComplete="off" aria-invalid={!!e.mailUsername} className={inputCls} />
            </Field>
            <PasswordField name="mailPassword" label="Mail Password" placeholder="SMTP password" hasPassword={settings.hasPassword} error={e.mailPassword} />
          </div>

          <div className="max-w-md">
            <Toggle name="mailActive" label="Mail Status" hint="Active — the store sends emails (orders, registration, newsletters)." defaultChecked={settings.active} />
          </div>

          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
          </button>
        </form>
      </Card>

      <Card title={<span className="flex items-center gap-2"><Send className="size-5 text-brand" /> Test your settings</span>}>
        <p className="mb-3 text-sm text-body">Save first, then send a test email to check the settings work. This works even while Mail Status is off.</p>
        <TestMailForm />
      </Card>

      <Card>
        <div className="mb-5 rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-500/40 dark:bg-rose-500/10">
          <p className="flex items-center gap-2 font-bold text-heading">
            <Info className="size-4 text-rose-500" /> Instruction
          </p>
          <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
            Please be careful when you are configuring SMTP. With an incorrect configuration, emails at order placement, new registration and newsletters will fail to send.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {Object.entries(tips).map(([title, rows]) => (
            <div key={title}>
              <p className="mb-2 text-sm font-bold text-heading">{title}</p>
              <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line text-sm text-body">
                {rows.map((r) => (
                  <li key={r} className="px-4 py-2.5 odd:bg-soft/60">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
