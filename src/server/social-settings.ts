import "server-only";
import { cache } from "react";
import { db, schema } from "@/db";
import {
  LEGACY_SOCIAL_KEYS,
  SOCIAL_LINKS_KEY,
  SOCIAL_NETWORK_KEYS,
  SOCIAL_PROVIDERS,
  socialNetworkLabel,
  type SocialAppSettings,
  type SocialLink,
  type SocialNetwork,
  type SocialProvider,
} from "@/lib/social";

const readAll = cache(async () => {
  const rows = await db.select().from(schema.settings);
  return new Map(rows.map((r) => [r.key, r.value]));
});

/** Saved social links in display order: the JSON list, or the old per-platform keys if it was never saved. */
export async function getSocialLinks(): Promise<SocialLink[]> {
  const map = await readAll();
  const raw = map.get(SOCIAL_LINKS_KEY);
  if (raw === undefined) {
    return Object.entries(LEGACY_SOCIAL_KEYS).flatMap(([network, key]) => {
      const url = map.get(key!);
      return url ? [{ network: network as SocialNetwork, label: socialNetworkLabel(network as SocialNetwork), url }] : [];
    });
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop anything malformed rather than breaking the footer.
    return parsed.filter(
      (l): l is SocialLink =>
        !!l && SOCIAL_NETWORK_KEYS.includes(l.network) && typeof l.label === "string" && typeof l.url === "string" && /^https?:\/\//.test(l.url),
    );
  } catch {
    return [];
  }
}

export async function getSocialAppSettings(): Promise<SocialAppSettings> {
  const map = await readAll();
  const entry = (p: SocialProvider) => ({
    appId: map.get(`${p}AppId`) ?? "",
    redirectUrl: map.get(`${p}RedirectUrl`) ?? "",
    hasSecret: !!map.get(`${p}AppSecret`),
  });
  return Object.fromEntries(SOCIAL_PROVIDERS.map(({ provider }) => [provider, entry(provider)])) as SocialAppSettings;
}

/** Full credentials for server-side social login code. Never pass the result to a client component. */
export async function getSocialAppCredentials(provider: SocialProvider) {
  const map = await readAll();
  return {
    appId: map.get(`${provider}AppId`) ?? "",
    appSecret: map.get(`${provider}AppSecret`) ?? "",
    redirectUrl: map.get(`${provider}RedirectUrl`) ?? "",
  };
}
