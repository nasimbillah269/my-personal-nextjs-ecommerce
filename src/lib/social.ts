/** Platforms an admin can pick for a social link (Admin → Social Setting). "other" is any custom link. */
export const SOCIAL_NETWORKS = [
  { network: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { network: "twitter", label: "Twitter / X", placeholder: "https://x.com/yourpage" },
  { network: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourpage" },
  { network: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourpage" },
  { network: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  { network: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/yourpage" },
  { network: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourpage" },
  { network: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/8801XXXXXXXXX" },
  { network: "telegram", label: "Telegram", placeholder: "https://t.me/yourchannel" },
  { network: "threads", label: "Threads", placeholder: "https://threads.net/@yourpage" },
  { network: "other", label: "Custom link", placeholder: "https://…" },
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]["network"];
export const SOCIAL_NETWORK_KEYS = SOCIAL_NETWORKS.map((n) => n.network) as [SocialNetwork, ...SocialNetwork[]];

/** One footer icon. `label` is the tooltip / screen-reader name (the platform name unless the admin typed one). */
export type SocialLink = { network: SocialNetwork; label: string; url: string };

/** Settings key holding the links as a JSON array of SocialLink, in display order. */
export const SOCIAL_LINKS_KEY = "socialLinks";
export const MAX_SOCIAL_LINKS = 20;

/** Per-platform keys used before links became a list; read once as a fallback, removed on the next save. */
export const LEGACY_SOCIAL_KEYS: Partial<Record<SocialNetwork, string>> = {
  facebook: "socialFacebook",
  twitter: "socialTwitter",
  instagram: "socialInstagram",
  linkedin: "socialLinkedin",
  youtube: "socialYoutube",
  pinterest: "socialPinterest",
};

export const socialNetworkLabel = (network: SocialNetwork) => SOCIAL_NETWORKS.find((n) => n.network === network)?.label ?? "Link";

/** Social login apps. Settings keys are `${provider}AppId`, `${provider}AppSecret` and `${provider}RedirectUrl`. */
export const SOCIAL_PROVIDERS = [
  { provider: "facebook", label: "Facebook" },
  { provider: "google", label: "Google" },
  { provider: "twitter", label: "Twitter" },
] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number]["provider"];

/** What the admin form gets: the secret itself never leaves the server, only whether one is saved. */
export type SocialAppSettings = Record<SocialProvider, { appId: string; redirectUrl: string; hasSecret: boolean }>;
