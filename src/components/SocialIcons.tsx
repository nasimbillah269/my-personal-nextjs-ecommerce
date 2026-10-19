import type { SocialNetwork } from "@/lib/social";

/** Brand glyphs drawn in lucide's stroke style (lucide-react no longer ships brand icons). */
const paths: Record<SocialNetwork, React.ReactNode> = {
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  twitter: <path d="M4 4l11.7 16H20L8.3 4zM4 20l6.8-6.8M20 4l-6.6 6.6" />,
  instagram: (
    <>
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  youtube: (
    <>
      <path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </>
  ),
  pinterest: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M11 13l-2.5 9M9.5 14.5c.6.9 1.6 1.5 2.9 1.5 2.7 0 4.6-2.4 4.6-5.3S14.9 6 12 6s-5 2.1-5 4.8c0 .9.3 1.8.8 2.4" />
    </>
  ),
  tiktok: <path d="M9 12a4 4 0 1 0 4 4V3c.4 2.6 2.4 4.6 5 5" />,
  whatsapp: (
    <>
      <path d="M3 21l1.7-4.7A9 9 0 1 1 8 19.6z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z" />
    </>
  ),
  telegram: (
    <>
      <path d="m22 3-20 7.5 7 2.5 2.5 7.5L15 15l5 4z" />
      <path d="m9 13 6.5-5.5" />
    </>
  ),
  threads: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M15.5 9v4a2.5 2.5 0 0 0 5 0v-1a8.5 8.5 0 1 0-3.5 6.9" />
    </>
  ),
  other: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </>
  ),
};

export function SocialIcon({ network, className = "size-4" }: { network: SocialNetwork; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[network]}
    </svg>
  );
}
