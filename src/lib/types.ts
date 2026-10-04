/** Shapes shared by server queries and client components (all plain, serializable data). */

export type Category = {
  id: number;
  slug: string;
  name: string;
  /** lucide icon name — resolve with categoryIcon() */
  icon: string;
};

export type Product = {
  /** URL slug */
  id: string;
  dbId: number;
  name: string;
  /** Default (first) variant */
  variant: string;
  price: number;
  oldPrice?: number;
  /** Category slug */
  category: string;
  image?: string;
  emoji: string;
  tint: string;
  stock: number;
};

export type Variant = { label: string; price: number; oldPrice?: number };

export type DescriptionBlock = {
  heading: string;
  lines?: string[];
  points?: { title: string; text: string }[];
  bullets?: string[];
};

export type ProductDetails = {
  summary: string;
  variants: Variant[];
  stock: number;
  tags: string[];
  brand: string;
  origin: string;
  description: DescriptionBlock[];
  imageCredit: { text: string; url: string | null } | null;
};

export type StoreSettings = {
  storeName: string;
  phone: string;
  email: string;
  address: string;
  insideDhakaFee: number;
  outsideDhakaFee: number;
  freeShippingMin: number;
  mobilePaymentNumber: string;
  /** Uploaded in Admin → Settings → Branding; null = use the built-in logo / icon. */
  logoUrl: string | null;
  faviconUrl: string | null;
};

export type AppliedCoupon = {
  code: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
};

export type OrderView = {
  orderNo: string;
  createdAt: string;
  status: string;
  paymentMethod: "cod" | "bkash" | "nagad" | "card";
  paymentStatus: string;
  trxId: string | null;
  delivery: "inside" | "outside";
  customer: { name: string; phone: string; email: string; division: string; area: string; address: string; note: string };
  totals: { subtotal: number; discount: number; shipping: number; total: number; coupon: string | null };
  items: { name: string; slug: string; variant: string; price: number; qty: number; emoji: string; tint: string; image: string | null }[];
};
