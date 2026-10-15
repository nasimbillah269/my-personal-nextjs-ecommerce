import {
  boolean,
  datetime,
  index,
  customType,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import {
  COMMENT_STATUSES,
  COUPON_TYPES,
  DELIVERY_ZONES,
  MENU_ITEM_TYPES,
  MENU_LOCATIONS,
  ORDER_STATUSES,
  PAGE_TEMPLATES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  POST_STATUSES,
  SUBSCRIBER_STATUSES,
} from "../lib/constants";

export {
  COMMENT_STATUSES,
  COUPON_TYPES,
  DELIVERY_ZONES,
  MENU_ITEM_TYPES,
  MENU_LOCATIONS,
  ORDER_STATUSES,
  PAGE_TEMPLATES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  POST_STATUSES,
  SUBSCRIBER_STATUSES,
};

/**
 * A JSON array of strings. MariaDB returns JSON columns as text and Drizzle's json() doesn't parse
 * on read, so this column parses strings itself (and still accepts already-parsed values from MySQL).
 */
const stringArray = customType<{ data: string[]; driverData: string | string[] }>({
  dataType: () => "json",
  toDriver: (value) => JSON.stringify(value),
  fromDriver: (value) => {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  },
});

/** Admin roles. `permissions` holds ADMIN_PERMISSIONS keys, or ["*"] for everything (the built-in Super Admin). */
export const roles = mysqlTable("roles", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  description: varchar("description", { length: 255 }).notNull().default(""),
  permissions: stringArray("permissions").notNull(),
  /** System roles can't be edited or deleted. */
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const admins = mysqlTable("admins", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 100 }).notNull(),
  /** No role = no access beyond the dashboard. */
  roleId: int("role_id").references(() => roles.id, { onDelete: "set null" }),
  /** Deactivated admins can't log in and lose their session immediately. */
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: datetime("last_login_at"),
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

/** Shoppers with an account. Guests can still check out without one. */
export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 120 }).notNull(),
  /** Normalised 01XXXXXXXXX; the main login id. */
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  /** Optional; also accepted at login. Lower-cased. */
  email: varchar("email", { length: 191 }).unique(),
  passwordHash: varchar("password_hash", { length: 100 }).notNull(),
  /** Blocked customers can't log in. */
  isActive: boolean("is_active").notNull().default(true),
  // Saved delivery address, pre-filled at checkout.
  division: varchar("division", { length: 40 }).notNull().default(""),
  area: varchar("area", { length: 120 }).notNull().default(""),
  address: varchar("address", { length: 500 }).notNull().default(""),
  lastLoginAt: datetime("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
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
    /** Set when the order was placed while signed in. */
    customerId: int("customer_id").references(() => customers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_phone_idx").on(t.phone),
    index("orders_created_idx").on(t.createdAt),
    index("orders_customer_idx").on(t.customerId),
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

/** Home page hero banners. Shown in sort order; the built-in slides are used while none are active. */
export const sliders = mysqlTable("sliders", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 120 }).notNull(),
  image: varchar("image", { length: 255 }).notNull(),
  link: varchar("link", { length: 500 }),
  sortOrder: int("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- Blog ---------- */

export const postCategories = mysqlTable("post_categories", {
  id: int("id").primaryKey().autoincrement(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 500 }).notNull().default(""),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const postTags = mysqlTable("post_tags", {
  id: int("id").primaryKey().autoincrement(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const posts = mysqlTable(
  "posts",
  {
    id: int("id").primaryKey().autoincrement(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    excerpt: varchar("excerpt", { length: 500 }).notNull().default(""),
    /** Lightweight markup: "## heading", "### subheading", "- bullet", "> quote", **bold**, [link](url). See src/lib/post-content.ts */
    content: text("content").notNull(),
    coverImage: varchar("cover_image", { length: 255 }),
    categoryId: int("category_id").references(() => postCategories.id, { onDelete: "set null" }),
    authorId: int("author_id").references(() => admins.id, { onDelete: "set null" }),
    status: mysqlEnum("status", POST_STATUSES).notNull().default("draft"),
    allowComments: boolean("allow_comments").notNull().default(true),
    /** Set the first time the post is published; a future date schedules it. */
    publishedAt: datetime("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("posts_status_idx").on(t.status, t.publishedAt), index("posts_category_idx").on(t.categoryId)],
);

export const postTagLinks = mysqlTable(
  "post_tag_links",
  {
    postId: int("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: int("tag_id")
      .notNull()
      .references(() => postTags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] }), index("post_tag_links_tag_idx").on(t.tagId)],
);

export const postComments = mysqlTable(
  "post_comments",
  {
    id: int("id").primaryKey().autoincrement(),
    postId: int("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    /** Set on admin replies; the admin's name is copied into authorName. */
    adminId: int("admin_id").references(() => admins.id, { onDelete: "set null" }),
    parentId: int("parent_id"),
    authorName: varchar("author_name", { length: 120 }).notNull(),
    authorEmail: varchar("author_email", { length: 191 }).notNull().default(""),
    content: text("content").notNull(),
    status: mysqlEnum("status", COMMENT_STATUSES).notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("post_comments_post_idx").on(t.postId, t.status), index("post_comments_status_idx").on(t.status)],
);

/* ---------- Static pages (About, Privacy Policy, …) ---------- */

export const pages = mysqlTable(
  "pages",
  {
    id: int("id").primaryKey().autoincrement(),
    /** Served at /{slug}; see RESERVED_PAGE_SLUGS for paths it can't take. */
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    shortDescription: varchar("short_description", { length: 500 }).notNull().default(""),
    /** Same lightweight markup as blog posts, see src/lib/post-content.ts */
    content: text("content").notNull(),
    image: varchar("image", { length: 255 }),
    banner: varchar("banner", { length: 255 }),
    template: mysqlEnum("template", PAGE_TEMPLATES).notNull().default("default"),
    isActive: boolean("is_active").notNull().default(true),
    /** Featured pages are linked in the store footer. */
    isFeatured: boolean("is_featured").notNull().default(false),
    publishedAt: datetime("published_at"),
    metaTitle: varchar("meta_title", { length: 255 }).notNull().default(""),
    metaDescription: varchar("meta_description", { length: 500 }).notNull().default(""),
    metaKeywords: varchar("meta_keywords", { length: 500 }).notNull().default(""),
    sortOrder: int("sort_order").notNull().default(0),
    authorId: int("author_id").references(() => admins.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("pages_active_idx").on(t.isActive, t.publishedAt)],
);

/* ---------- Navigation menus ---------- */

export const menus = mysqlTable("menus", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 120 }).notNull(),
  /** Where the store renders it; at most one active menu per location (enforced on save). */
  location: mysqlEnum("location", MENU_LOCATIONS),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: int("created_by").references(() => admins.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const menuItems = mysqlTable(
  "menu_items",
  {
    id: int("id").primaryKey().autoincrement(),
    menuId: int("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    /** One level of nesting (dropdowns). Items are rewritten on every save, so no FK is needed. */
    parentId: int("parent_id"),
    type: mysqlEnum("type", MENU_ITEM_TYPES).notNull(),
    /** Id of the linked page/category/post; its URL is resolved when rendering, so slug changes follow. */
    refId: int("ref_id"),
    label: varchar("label", { length: 120 }).notNull(),
    url: varchar("url", { length: 500 }).notNull().default(""),
    openInNewTab: boolean("open_in_new_tab").notNull().default(false),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("menu_items_menu_idx").on(t.menuId, t.sortOrder)],
);

/** Newsletter sign-ups from the store. */
export const subscribers = mysqlTable(
  "subscribers",
  {
    id: int("id").primaryKey().autoincrement(),
    email: varchar("email", { length: 191 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull().default(""),
    status: mysqlEnum("status", SUBSCRIBER_STATUSES).notNull().default("subscribed"),
    /** Where they signed up, e.g. "home" or "admin". */
    source: varchar("source", { length: 40 }).notNull().default("website"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("subscribers_status_idx").on(t.status)],
);
