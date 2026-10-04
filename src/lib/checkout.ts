import type { AppliedCoupon, StoreSettings } from "./types";
import { formatPrice } from "./ui";

/** Used until the settings table has a value (and to seed it). */
export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Ultimate Organic Life",
  phone: "09678242404",
  email: "info@ultimateorganiclife.com",
  address: "Dhaka, Bangladesh",
  insideDhakaFee: 60,
  outsideDhakaFee: 120,
  freeShippingMin: 3000,
  mobilePaymentNumber: "01XXXXXXXXX",
  logoUrl: null,
  faviconUrl: null,
};

export const deliveryOptions = [
  { id: "inside", label: "Inside Dhaka", eta: "1–2 days" },
  { id: "outside", label: "Outside Dhaka", eta: "3–5 days" },
] as const;
export type DeliveryId = (typeof deliveryOptions)[number]["id"];

export const deliveryFee = (id: DeliveryId, s: Pick<StoreSettings, "insideDhakaFee" | "outsideDhakaFee">) =>
  id === "inside" ? s.insideDhakaFee : s.outsideDhakaFee;

export const paymentMethods = [
  { id: "cod", label: "Cash on Delivery", short: "COD", color: "#13a2a8", description: "Pay in cash when your order arrives." },
  { id: "bkash", label: "bKash", short: "bKash", color: "#e2136e", description: "Send money, then enter the Transaction ID." },
  { id: "nagad", label: "Nagad", short: "Nagad", color: "#f6921e", description: "Send money, then enter the Transaction ID." },
  { id: "card", label: "Card / Online Banking", short: "Card", color: "#253d4e", description: "Visa, Mastercard, AMEX & net banking." },
] as const;
export type PaymentId = (typeof paymentMethods)[number]["id"];

export const divisions = ["Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"];

export const normalizeCoupon = (code: string) => code.trim().toUpperCase();

export const describeCoupon = (c: AppliedCoupon) =>
  `${c.type === "percent" ? `${c.value}%` : formatPrice(c.value)} off${c.minOrder ? ` orders over ${formatPrice(c.minOrder)}` : " your order"}`;

export function computeTotals(
  subtotal: number,
  coupon: AppliedCoupon | null,
  s: Pick<StoreSettings, "insideDhakaFee" | "outsideDhakaFee" | "freeShippingMin">,
  delivery?: DeliveryId,
) {
  const couponActive = !!coupon && subtotal >= coupon.minOrder;
  const rawDiscount = !couponActive ? 0 : coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  const discount = Math.min(rawDiscount, subtotal);
  const freeShipping = s.freeShippingMin > 0 && subtotal >= s.freeShippingMin;
  const shipping = delivery ? (freeShipping ? 0 : deliveryFee(delivery, s)) : null;
  return {
    subtotal,
    discount,
    couponActive,
    freeShipping,
    shipping,
    total: subtotal - discount + (shipping ?? 0),
  };
}

export const normalizePhone = (value: string) => value.replace(/[\s-]/g, "").replace(/^\+?88/, "");
export const isValidBdPhone = (value: string) => /^01[3-9]\d{8}$/.test(normalizePhone(value));

export const variantLabel = (variant: string) => (variant === "Regular" ? null : variant);

export const orderStatusMeta: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", className: "bg-sky-100 text-sky-700" },
  processing: { label: "Processing", className: "bg-indigo-100 text-indigo-700" },
  shipped: { label: "Shipped", className: "bg-violet-100 text-violet-700" },
  delivered: { label: "Delivered", className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", className: "bg-rose-100 text-rose-700" },
};

export const paymentStatusMeta: Record<string, { label: string; className: string }> = {
  unpaid: { label: "Unpaid", className: "bg-slate-100 text-slate-600" },
  pending: { label: "Verifying", className: "bg-amber-100 text-amber-700" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700" },
  refunded: { label: "Refunded", className: "bg-rose-100 text-rose-700" },
};
