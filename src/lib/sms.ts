export const SMS_TYPES = ["masking", "non-masking"] as const;
export type SmsType = (typeof SMS_TYPES)[number];

/** Rows in the `settings` table that hold the SMS gateway configuration. */
export const SMS_SETTING_KEYS = [
  "smsType",
  "smsSenderId",
  "smsUrlNonMasking",
  "smsUrlMasking",
  "smsUsername",
  "smsPassword",
  "smsActive",
];

export type SmsSettings = {
  type: SmsType;
  senderId: string;
  urlNonMasking: string;
  urlMasking: string;
  username: string;
  active: boolean;
};

/** Bangladeshi mobile number → 8801XXXXXXXXX, or null when it isn't one. */
export function normalizeBdPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.replace(/^(?:00)?880/, "").replace(/^0/, "");
  return /^1[3-9]\d{8}$/.test(local) ? `880${local}` : null;
}
