import {
  boolean,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { COUPON_TYPES, DELIVERY_ZONES, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "../lib/constants";

export { COUPON_TYPES, DELIVERY_ZONES, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES };

export const admins = mysqlTable("admins", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  /** lucide-react icon name, see src/lib/category-icons.ts */
  icon: varchar("icon", { length: 40 }).notNull().default("LayoutGrid"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = mysqlTable(
  "products",
  {
    id: int("id").primaryKey().autoincrement(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    categoryId: int("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    summary: text("summary").notNull(),
    /** Lightweight markup: "## heading", "### point title", "- bullet", plain lines. See src/lib/description.ts */
    description: text("description").notNull(),
    stock: int("stock").notNull().default(0),
    image: varchar("image", { length: 255 }),
    /** Attribution for licensed photos, e.g. “Title” by Author · CC BY 2.0 */
    imageCredit: varchar("image_credit", { length: 300 }),
    imageCreditUrl: varchar("image_credit_url", { length: 500 }),
    emoji: varchar("emoji", { length: 16 }).notNull().default("🌿"),
    tint: varchar("tint", { length: 16 }).notNull().default("#e6f4ea"),
    tags: varchar("tags", { length: 500 }).notNull().default(""),
    brand: varchar("brand", { length: 120 }).notNull().default("Ultimate Organic Life"),
    origin: varchar("origin", { length: 120 }).notNull().default("Bangladesh"),
    isActive: boolean("is_active").notNull().default(true),
    isPopular: boolean("is_popular").notNull().default(false),
    isDailyBest: boolean("is_daily_best").notNull().default(false),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("products_category_idx").on(t.categoryId)],
);

/** Every product has at least one variant; the first (lowest sort_order) is the default/listing price. */
export const productVariants = mysqlTable(
  "product_variants",
  {
    id: int("id").primaryKey().autoincrement(),
    productId: int("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 60 }).notNull(),
    price: int("price").notNull(),
    oldPrice: int("old_price"),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const coupons = mysqlTable("coupons", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  type: mysqlEnum("type", COUPON_TYPES).notNull(),
  value: int("value").notNull(),
  minOrder: int("min_order").notNull().default(0),
  usageLimit: int("usage_limit"),
  usedCount: int("used_count").notNull().default(0),
  expiresAt: datetime("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").primaryKey().autoincrement(),
    orderNo: varchar("order_no", { length: 20 }).notNull().unique(),
    status: mysqlEnum("status", ORDER_STATUSES).notNull().default("pending"),
    paymentMethod: mysqlEnum("payment_method", PAYMENT_METHODS).notNull(),
    paymentStatus: mysqlEnum("payment_status", PAYMENT_STATUSES).notNull().default("unpaid"),
    trxId: varchar("trx_id", { length: 40 }),
    customerName: varchar("customer_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 191 }).notNull().default(""),
    division: varchar("division", { length: 40 }).notNull(),
    area: varchar("area", { length: 120 }).notNull(),
    address: varchar("address", { length: 500 }).notNull(),
    note: varchar("note", { length: 500 }).notNull().default(""),
    adminNote: varchar("admin_note", { length: 1000 }).notNull().default(""),
    delivery: mysqlEnum("delivery", DELIVERY_ZONES).notNull(),
    subtotal: int("subtotal").notNull(),
    discount: int("discount").notNull().default(0),
    shipping: int("shipping").notNull().default(0),
    total: int("total").notNull(),
    couponCode: varchar("coupon_code", { length: 40 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_phone_idx").on(t.phone),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").primaryKey().autoincrement(),
    orderId: int("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: int("product_id").references(() => products.id, { onDelete: "set null" }),
    // Snapshot of the product at order time, so history survives product edits/deletes.
    productName: varchar("product_name", { length: 255 }).notNull(),
    productSlug: varchar("product_slug", { length: 160 }).notNull(),
    variant: varchar("variant", { length: 60 }).notNull(),
    price: int("price").notNull(),
    qty: int("qty").notNull(),
    emoji: varchar("emoji", { length: 16 }).notNull().default("🌿"),
    tint: varchar("tint", { length: 16 }).notNull().default("#e6f4ea"),
    image: varchar("image", { length: 255 }),
  },
  (t) => [index("items_order_idx").on(t.orderId), index("items_product_idx").on(t.productId)],
);

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
});
