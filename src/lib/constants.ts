/** Enum values shared by the DB schema, server validation and client UI. */
export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "refunded"] as const;
export const PAYMENT_METHODS = ["cod", "bkash", "nagad", "card"] as const;
export const DELIVERY_ZONES = ["inside", "outside"] as const;
export const COUPON_TYPES = ["percent", "flat"] as const;
export const POST_STATUSES = ["draft", "published"] as const;
export const COMMENT_STATUSES = ["pending", "approved", "spam"] as const;
export const PAGE_TEMPLATES = ["default", "full-width", "with-sidebar"] as const;
export const PAGE_TEMPLATE_LABELS: Record<(typeof PAGE_TEMPLATES)[number], string> = {
  default: "Default (centred, reading width)",
  "full-width": "Full width",
  "with-sidebar": "With contact sidebar",
};
/** Top-level paths a store page slug can't use, because a route already lives there. */
export const RESERVED_PAGE_SLUGS = ["account", "admin", "blog", "cart", "checkout", "login", "media", "products", "register", "api", "_next"];

/** Admin panel colour theme, stored in a cookie so the server renders the right one. */
export type AdminTheme = "light" | "dark";
export const ADMIN_THEME_COOKIE = "admin-theme";

export const MENU_LOCATIONS = ["header", "top-bar", "footer-1", "footer-2", "footer-3"] as const;
export type MenuLocation = (typeof MENU_LOCATIONS)[number];
export const MENU_LOCATION_LABELS: Record<MenuLocation, string> = {
  header: "Header Menu",
  "top-bar": "Top Bar",
  "footer-1": "Footer One",
  "footer-2": "Footer Two",
  "footer-3": "Footer Three",
};
/** What each location replaces in the store, shown as help text in the admin. */
export const MENU_LOCATION_HINTS: Record<MenuLocation, string> = {
  header: "Main navigation bar; sub-items become dropdowns",
  "top-bar": "Small links above the logo",
  "footer-1": "Footer column 1 (default: Company)",
  "footer-2": "Footer column 2 (default: Account)",
  "footer-3": "Footer column 3 (default: Popular categories)",
};
export const MENU_ITEM_TYPES = ["custom", "page", "product_category", "post_category", "post"] as const;
export type MenuItemType = (typeof MENU_ITEM_TYPES)[number];

/** Where a gallery is shown in the store. */
export const GALLERY_LOCATIONS = ["home", "about", "gallery-page", "footer", "sidebar"] as const;
export type GalleryLocation = (typeof GALLERY_LOCATIONS)[number];
export const GALLERY_LOCATION_LABELS: Record<GalleryLocation, string> = {
  home: "Home Page",
  about: "About Page",
  "gallery-page": "Gallery Page",
  footer: "Footer",
  sidebar: "Sidebar",
};

export const SUBSCRIBER_STATUSES = ["subscribed", "unsubscribed"] as const;

/** What a role can open in the admin panel. The dashboard and your own profile are always available. */
export const ADMIN_PERMISSIONS = [
  { key: "orders", label: "Orders", hint: "View and update orders" },
  { key: "products", label: "Products", hint: "Add, edit and delete products" },
  { key: "catalog", label: "Categories & coupons", hint: "Product categories and discount codes" },
  { key: "posts", label: "Blog", hint: "Posts, post categories, tags and comments" },
  { key: "pages", label: "Pages", hint: "About, Privacy Policy and other pages" },
  { key: "menus", label: "Menus", hint: "Header and footer menus" },
  { key: "sliders", label: "Sliders", hint: "Home page banners" },
  { key: "galleries", label: "Galleries", hint: "Image galleries and their photos" },
  { key: "clients", label: "Clients", hint: "Client logos shown in the store" },
  { key: "brands", label: "Brands", hint: "Product brands and their logos" },
  { key: "customers", label: "Customers", hint: "Customer accounts" },
  { key: "subscribers", label: "Subscribers", hint: "Newsletter list and export" },
  { key: "admins", label: "Admins & roles", hint: "Manage admin users and their roles" },
  { key: "settings", label: "Store settings", hint: "Branding, contact details and delivery charges" },
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]["key"];
export const ALL_PERMISSIONS = ADMIN_PERMISSIONS.map((p) => p.key) as AdminPermission[];
