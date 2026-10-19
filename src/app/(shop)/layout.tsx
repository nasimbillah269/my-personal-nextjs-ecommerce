import { CartProvider } from "@/components/CartProvider";
import { CartToastProvider } from "@/components/CartToast";
import { BackToTop, ChatButton, Footer, MobileBottomNav } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StoreProvider } from "@/components/StoreProvider";
import { getCustomer } from "@/server/customer-auth";
import { getStoreMenus } from "@/server/menus";
import { getFooterPages } from "@/server/pages";
import { getCategories, getSettings } from "@/server/queries";
import { getSocialLinks } from "@/server/social-settings";

// Catalog, prices and stock are edited in the admin panel, so always render fresh data.
export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const [settings, categories, footerPages, menus, me, socialLinks] = await Promise.all([
    getSettings(),
    getCategories(),
    getFooterPages(),
    getStoreMenus(),
    getCustomer(),
    getSocialLinks(),
  ]);
  const customer = me && { name: me.name, phone: me.phone, email: me.email, division: me.division, area: me.area, address: me.address };

  return (
    <StoreProvider value={{ settings, categories, footerPages, menus, customer, socialLinks }}>
      <CartProvider>
        <CartToastProvider>
          <Header />
          {children}
          <Footer />
          <BackToTop />
          <ChatButton />
          <MobileBottomNav />
        </CartToastProvider>
      </CartProvider>
    </StoreProvider>
  );
}
