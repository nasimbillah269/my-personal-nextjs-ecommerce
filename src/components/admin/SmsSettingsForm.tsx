"use client";

import { Info, Loader2, MessageSquareText, Save, Send } from "lucide-react";
import type { SmsSettings } from "@/lib/sms";
import type { FormState } from "@/server/admin/form-state";
import { saveSmsSettings, sendTestSms } from "@/server/admin/settings-actions";
import { Toggle, useFormAction } from "./controls";
import { PasswordField } from "./MailSettingsForm";
import { btnPrimary, btnSecondary, Card, Field, inputCls } from "./ui";

function TestSmsForm() {
  const { state, onSubmit, pending } = useFormAction<FormState>(sendTestSms, null, { toast: false });
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input
          name="testPhone"
          type="tel"
          required
          placeholder="01XXXXXXXXX"
          aria-label="Send a test SMS to"
          aria-invalid={!!state?.errors?.testPhone}
          className={inputCls}
        />
        {state && !state.ok && state.message && <p className="mt-1.5 text-xs font-semibold break-words text-red-500">{state.message}</p>}
        {state?.ok && <p className="mt-1.5 text-xs font-semibold text-emerald-600">{state.message}</p>}
      </div>
      <button type="submit" disabled={pending} className={`${btnSecondary} h-11`}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send test SMS
      </button>
    </form>
  );
}

export function SmsSettingsForm({ settings }: { settings: SmsSettings & { hasPassword: boolean } }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveSmsSettings, null);
  const e = state?.errors ?? {};
  const text = (name: string, value: string, placeholder: string) => (
    <input id={name} name={name} defaultValue={value} placeholder={placeholder} autoComplete="off" aria-invalid={!!e[name]} className={inputCls} />
  );

  return (
    <div className="space-y-6">
      <Card title={<span className="flex items-center gap-2"><MessageSquareText className="size-5 text-brand" /> SMS Setting</span>}>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="SMS Type" htmlFor="smsType" error={e.smsType} hint="Masking shows your brand name as sender; non-masking shows a number.">
              <select id="smsType" name="smsType" defaultValue={settings.type} className={`${inputCls} cursor-pointer`}>
                <option value="masking">Masking</option>
                <option value="non-masking">Non-Masking</option>
              </select>
            </Field>
            <Field label="SMS Sender ID" htmlFor="smsSenderId" error={e.smsSenderId}>
              {text("smsSenderId", settings.senderId, "e.g. 8809648910900 or YourBrand")}
            </Field>
            <Field label="SMS Url Non-Masking" htmlFor="smsUrlNonMasking" error={e.smsUrlNonMasking}>
              {text("smsUrlNonMasking", settings.urlNonMasking, "http://bulksmsbd.net/api/smsapi")}
            </Field>
            <Field label="SMS Url Masking" htmlFor="smsUrlMasking" error={e.smsUrlMasking}>
              {text("smsUrlMasking", settings.urlMasking, "http://bulksmsbd.net/api/smsapi")}
            </Field>
            <Field label="SMS Username" htmlFor="smsUsername" error={e.smsUsername} hint="For bulksmsbd.net this is your API key.">
              {text("smsUsername", settings.username, "Username / API key")}
            </Field>
            <PasswordField name="smsPassword" label="SMS Password" placeholder="Leave empty if your gateway only needs an API key" hasPassword={settings.hasPassword} error={e.smsPassword} />
          </div>

          <div className="max-w-md">
            <Toggle name="smsActive" label="SMS Status" hint="Active — the store sends SMS (order updates, OTP, etc.)." defaultChecked={settings.active} />
          </div>

          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
          </button>
        </form>
      </Card>

      <Card title={<span className="flex items-center gap-2"><Send className="size-5 text-brand" /> Test your settings</span>}>
        <p className="mb-3 text-sm text-body">Save first, then send a test SMS to check the gateway works. This works even while SMS Status is off.</p>
        <TestSmsForm />
      </Card>

      <Card>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-body dark:border-sky-500/40 dark:bg-sky-500/10">
          <p className="mb-2 flex items-center gap-2 font-bold text-heading">
            <Info className="size-4 text-sky-500" /> Using another SMS provider?
          </p>
          <p>
            By default the URL is called in bulksmsbd.net format: <code className="break-all">?api_key=…&amp;type=text&amp;senderid=…&amp;number=…&amp;message=…</code>
          </p>
          <p className="mt-2">
            For any other provider, put placeholders in the URL and they are filled in automatically:{" "}
            <code>{"{number}"}</code>, <code>{"{message}"}</code>, <code>{"{sender_id}"}</code>, <code>{"{username}"}</code>, <code>{"{password}"}</code>.
          </p>
          <p className="mt-2 break-all text-xs">
            Example: <code>{"https://api.example.com/send?user={username}&pass={password}&from={sender_id}&to={number}&text={message}"}</code>
          </p>
        </div>
      </Card>
    </div>
  );
}
