/** Enum values shared by the DB schema, server validation and client UI. */
export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "refunded"] as const;
export const PAYMENT_METHODS = ["cod", "bkash", "nagad", "card"] as const;
export const DELIVERY_ZONES = ["inside", "outside"] as const;
export const COUPON_TYPES = ["percent", "flat"] as const;

/** Admin panel colour theme, stored in a cookie so the server renders the right one. */
export type AdminTheme = "light" | "dark";
export const ADMIN_THEME_COOKIE = "admin-theme";
