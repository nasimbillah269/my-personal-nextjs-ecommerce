import { CartProvider } from "@/components/CartProvider";
import { BackToTop, ChatButton, Footer, MobileBottomNav } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StoreProvider } from "@/components/StoreProvider";
import { getCategories, getSettings } from "@/server/queries";

// Catalog, prices and stock are edited in the admin panel, so always render fresh data.
export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);

  return (
    <StoreProvider value={{ settings, categories }}>
      <CartProvider>
        <Header />
        {children}
        <Footer />
        <BackToTop />
        <ChatButton />
        <MobileBottomNav />
      </CartProvider>
    </StoreProvider>
  );
}
