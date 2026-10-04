import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Quicksand } from "next/font/google";
import { DEFAULT_SETTINGS } from "@/lib/checkout";
import { getSettings } from "@/server/queries";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  // Favicon and store name come from Admin → Settings. Fall back to defaults if the DB is unreachable.
  const settings = await getSettings().catch(() => DEFAULT_SETTINGS);
  const icon = settings.faviconUrl ?? "/brand-icon.svg";
  return {
    title: `${settings.storeName} — Organic Food & Natural Care`,
    description: "Shop certified organic oils, seeds, honey, salt and natural care products online in Bangladesh.",
    icons: { icon, shortcut: icon, apple: settings.faviconUrl ?? undefined },
  };
}

export const viewport: Viewport = {
  themeColor: "#13a2a8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${quicksand.variable} ${hindSiliguri.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
