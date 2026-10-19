export const MAIL_DRIVERS = ["smtp", "sendmail"] as const;
export const MAIL_ENCRYPTIONS = ["tls", "ssl", "none"] as const;

export type MailDriver = (typeof MAIL_DRIVERS)[number];
export type MailEncryption = (typeof MAIL_ENCRYPTIONS)[number];

/** Rows in the `settings` table that hold the mail configuration. */
export const MAIL_SETTING_KEYS = [
  "mailFromAddress",
  "mailFromName",
  "mailDriver",
  "mailHost",
  "mailPort",
  "mailEncryption",
  "mailUsername",
  "mailPassword",
  "mailActive",
];

export type MailSettings = {
  fromAddress: string;
  fromName: string;
  driver: MailDriver;
  host: string;
  port: number;
  encryption: MailEncryption;
  username: string;
  active: boolean;
};
