"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, KeyRound, Loader2, Palette, Save, Store, Trash2, Truck, UserRound, X } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import type { FormState } from "@/server/admin/form-state";
import { changePassword, saveBranding, saveProfile, saveSettings } from "@/server/admin/settings-actions";
import { Logo, LogoMark } from "../Logo";
import { useFormAction } from "./controls";
import { btnPrimary, btnSecondary, Card, Field, inputCls } from "./ui";

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={pending} className={btnPrimary}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      {children}
    </button>
  );
}

export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveSettings, null);
  const e = state?.errors ?? {};
  const input = (name: Exclude<keyof StoreSettings, "logoUrl" | "faviconUrl">, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={name} name={name} defaultValue={settings[name]} aria-invalid={!!e[name]} className={inputCls} {...props} />
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title={<span className="flex items-center gap-2"><Store className="size-5 text-brand" /> Store information</span>}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Store name" htmlFor="storeName" error={e.storeName}>{input("storeName")}</Field>
          <Field label="Hotline / phone" htmlFor="phone" error={e.phone}>{input("phone", { type: "tel" })}</Field>
          <Field label="Email" htmlFor="email" error={e.email}>{input("email", { type: "email" })}</Field>
          <Field label="Address" htmlFor="address" error={e.address}>{input("address")}</Field>
        </div>
      </Card>

      <Card title={<span className="flex items-center gap-2"><Truck className="size-5 text-brand" /> Delivery & payment</span>}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Inside Dhaka fee (৳)" htmlFor="insideDhakaFee" error={e.insideDhakaFee}>{input("insideDhakaFee", { type: "number", min: 0 })}</Field>
          <Field label="Outside Dhaka fee (৳)" htmlFor="outsideDhakaFee" error={e.outsideDhakaFee}>{input("outsideDhakaFee", { type: "number", min: 0 })}</Field>
          <Field label="Free delivery from (৳)" htmlFor="freeShippingMin" hint="Set 0 to turn off free delivery." error={e.freeShippingMin}>
            {input("freeShippingMin", { type: "number", min: 0 })}
          </Field>
          <Field label="bKash / Nagad number" htmlFor="mobilePaymentNumber" hint="Customers send money to this number." error={e.mobilePaymentNumber}>
            {input("mobilePaymentNumber", { type: "tel" })}
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <SubmitButton pending={pending}>Save settings</SubmitButton>
      </div>
    </form>
  );
}

/* ---------- Branding ---------- */

function useImagePick(initial: string | null) {
  const [preview, setPreview] = useState(initial);
  const [removed, setRemoved] = useState(false);
  // Changing the key remounts the <input type=file>, which clears its selected file.
  const [inputKey, setInputKey] = useState(0);
  return {
    preview,
    removed,
    inputKey,
    pick(file: File | undefined) {
      if (!file) return;
      setPreview(URL.createObjectURL(file));
      setRemoved(false);
    },
    remove() {
      setInputKey((k) => k + 1);
      setPreview(null);
      setRemoved(true);
    },
    /** After a successful save the server has the file; clear the input so it isn't uploaded again. */
    settle() {
      setInputKey((k) => k + 1);
      setRemoved(false);
    },
  };
}

function UploadButtons({
  name,
  accept,
  label,
  picker,
}: {
  name: string;
  accept: string;
  label: string;
  picker: ReturnType<typeof useImagePick>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <label className={`${btnSecondary} cursor-pointer`}>
        <ImagePlus className="size-4" /> {picker.preview ? `Change ${label}` : `Upload ${label}`}
        <input
          key={picker.inputKey}
          type="file"
          name={name}
          accept={accept}
          className="sr-only"
          onChange={(e) => picker.pick(e.target.files?.[0])}
        />
      </label>
      {picker.preview && (
        <button type="button" onClick={picker.remove} className={`${btnSecondary} hover:border-red-200 hover:text-red-500`}>
          <Trash2 className="size-4" /> Remove
        </button>
      )}
    </div>
  );
}

export function BrandingForm({
  logoUrl,
  faviconUrl,
  storeName,
}: {
  logoUrl: string | null;
  faviconUrl: string | null;
  storeName: string;
}) {
  const logo = useImagePick(logoUrl);
  const favicon = useImagePick(faviconUrl);
  const { state, onSubmit, pending } = useFormAction<FormState>(async (prev, data) => {
    const result = await saveBranding(prev, data);
    if (result?.ok) {
      logo.settle();
      favicon.settle();
    }
    return result;
  }, null);
  const e = state?.errors ?? {};

  return (
    <form onSubmit={onSubmit}>
      <Card
        title={
          <span className="flex items-center gap-2">
            <Palette className="size-5 text-brand" /> Branding
          </span>
        }
      >
        <input type="hidden" name="removeLogo" value={logo.removed ? "on" : ""} />
        <input type="hidden" name="removeFavicon" value={favicon.removed ? "on" : ""} />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Logo */}
          <div>
            <p className="mb-1.5 text-sm font-bold text-heading">Store logo</p>
            <div className="grid h-36 place-items-center rounded-xl border-2 border-dashed border-line bg-soft p-4">
              {logo.preview ? (
                <Image
                  src={logo.preview}
                  alt="Logo preview"
                  width={240}
                  height={80}
                  unoptimized
                  className="max-h-24 w-auto max-w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <Logo alt={storeName} />
                  <p className="mt-2 text-[11px] text-body">Built-in logo</p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <UploadButtons name="logo" accept="image/png,image/jpeg,image/webp,image/avif" label="logo" picker={logo} />
            </div>
            {e.logo ? (
              <p className="mt-1.5 text-xs font-semibold text-red-500">{e.logo}</p>
            ) : (
              <p className="mt-1.5 text-xs text-body">
                PNG, JPG or WEBP · max 2 MB. A wide transparent PNG (e.g. 600×200) looks best.
              </p>
            )}
          </div>

          {/* Favicon */}
          <div>
            <p className="mb-1.5 text-sm font-bold text-heading">Favicon (browser tab icon)</p>
            <div className="flex h-36 flex-col justify-center gap-4 rounded-xl border-2 border-dashed border-line bg-soft p-4">
              {/* Browser-tab mockup */}
              <div className="mx-auto flex w-full max-w-xs items-center gap-2 rounded-t-lg border border-b-0 border-line bg-white px-3 py-2 shadow-sm">
                <span className="grid size-4 shrink-0 place-items-center overflow-hidden">
                  {favicon.preview ? (
                    <Image src={favicon.preview} alt="" width={16} height={16} unoptimized className="size-4 object-contain" />
                  ) : (
                    <LogoMark className="h-3.5 w-4" />
                  )}
                </span>
                <span className="truncate text-xs text-heading">{storeName}</span>
                <X className="ml-auto size-3 shrink-0 text-body" />
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="grid size-14 place-items-center rounded-xl border border-line bg-white">
                  {favicon.preview ? (
                    <Image
                      src={favicon.preview}
                      alt="Favicon preview"
                      width={40}
                      height={40}
                      unoptimized
                      className="size-10 object-contain"
                    />
                  ) : (
                    <LogoMark className="h-8 w-10" />
                  )}
                </span>
                <span className="text-[11px] text-body">{favicon.preview ? "Your favicon" : "Built-in icon"}</span>
              </div>
            </div>
            <div className="mt-3">
              <UploadButtons
                name="favicon"
                accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp,.ico"
                label="favicon"
                picker={favicon}
              />
            </div>
            {e.favicon ? (
              <p className="mt-1.5 text-xs font-semibold text-red-500">{e.favicon}</p>
            ) : (
              <p className="mt-1.5 text-xs text-body">Square PNG or ICO, at least 64×64 · max 512 KB.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-line pt-5">
          <SubmitButton pending={pending}>Save branding</SubmitButton>
        </div>
      </Card>
    </form>
  );
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveProfile, null);
  const e = state?.errors ?? {};
  return (
    <Card title={<span className="flex items-center gap-2"><UserRound className="size-5 text-brand" /> Your profile</span>}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name" htmlFor="profile-name" error={e.name}>
          <input id="profile-name" name="name" defaultValue={name} className={inputCls} />
        </Field>
        <Field label="Login email" htmlFor="profile-email" error={e.email}>
          <input id="profile-email" name="email" type="email" defaultValue={email} className={inputCls} />
        </Field>
        <SubmitButton pending={pending}>Save profile</SubmitButton>
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { state, onSubmit, pending } = useFormAction<FormState>(
    async (prev, data) => {
      const result = await changePassword(prev, data);
      if (result?.ok) formRef.current?.reset();
      return result;
    },
    null,
  );
  const e = state?.errors ?? {};
  return (
    <Card title={<span className="flex items-center gap-2"><KeyRound className="size-5 text-brand" /> Change password</span>}>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
        <Field label="Current password" htmlFor="current" error={e.current}>
          <input id="current" name="current" type="password" autoComplete="current-password" className={inputCls} />
        </Field>
        <Field label="New password" htmlFor="next" error={e.next} hint="At least 8 characters.">
          <input id="next" name="next" type="password" autoComplete="new-password" className={inputCls} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" error={e.confirm}>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" className={inputCls} />
        </Field>
        <SubmitButton pending={pending}>Update password</SubmitButton>
      </form>
    </Card>
  );
}
