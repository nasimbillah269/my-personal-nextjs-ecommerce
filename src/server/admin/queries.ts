import "server-only";
import { and, asc, count, desc, eq, gte, inArray, like, lt, lte, ne, or, sql, sum, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { COMMENT_STATUSES, ORDER_STATUSES } from "@/lib/constants";

const { orders, orderItems, products, productVariants, categories, coupons, sliders } = schema;

export const PAGE_SIZE = 15;

/** Raw SQL datetimes come back as "YYYY-MM-DD HH:MM:SS" strings in UTC (session time_zone is +00:00). */
const toUtcDate = (v: unknown) => (v instanceof Date ? v : new Date(`${String(v).replace(" ", "T")}Z`));

const DAY = 86_400_000;
const notCancelled = ne(orders.status, "cancelled");

/* ---------- Dashboard ---------- */

async function periodStats(from: Date, to: Date) {
  const [row] = await db
    .select({
      revenue: sum(orders.total).mapWith(Number),
      orders: count(),
      customers: sql<number>`COUNT(DISTINCT ${orders.phone})`.mapWith(Number),
    })
    .from(orders)
    .where(and(notCancelled, gte(orders.createdAt, from), lt(orders.createdAt, to)));
  const revenue = row?.revenue ?? 0;
  const n = row?.orders ?? 0;
  return { revenue, orders: n, customers: row?.customers ?? 0, aov: n ? Math.round(revenue / n) : 0 };
}

export async function getDashboardData() {
  const now = new Date();
  const start = new Date(now.getTime() - 30 * DAY);
  const prevStart = new Date(now.getTime() - 60 * DAY);

  // Daily buckets start at UTC midnight 29 days ago so the chart has exactly 30 columns.
  const seriesStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 29 * DAY);

  const [current, previous, daily, statusRows, recent, top, lowStock, pending] = await Promise.all([
    periodStats(start, now),
    periodStats(prevStart, start),
    db
      .select({
        day: sql<string>`DATE_FORMAT(${orders.createdAt}, '%Y-%m-%d')`,
        revenue: sum(orders.total).mapWith(Number),
        orders: count(),
      })
      .from(orders)
      .where(and(notCancelled, gte(orders.createdAt, seriesStart)))
      .groupBy(sql`1`),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        customerName: orders.customerName,
        total: orders.total,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(7),
    db
      .select({
        name: orderItems.productName,
        slug: orderItems.productSlug,
        emoji: sql<string>`MAX(${orderItems.emoji})`,
        tint: sql<string>`MAX(${orderItems.tint})`,
        qty: sum(orderItems.qty).mapWith(Number),
        revenue: sql<number>`SUM(${orderItems.price} * ${orderItems.qty})`.mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(notCancelled, gte(orders.createdAt, start)))
      .groupBy(orderItems.productSlug, orderItems.productName)
      .orderBy(desc(sum(orderItems.qty)))
      .limit(5),
    db
      .select({ id: products.id, name: products.name, stock: products.stock, emoji: products.emoji, tint: products.tint })
      .from(products)
      .where(and(eq(products.isActive, true), lte(products.stock, 10)))
      .orderBy(asc(products.stock))
      .limit(6),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "pending")),
  ]);

  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(seriesStart.getTime() + i * DAY);
    const key = date.toISOString().slice(0, 10);
    return { date: key, revenue: byDay.get(key)?.revenue ?? 0, orders: byDay.get(key)?.orders ?? 0 };
  });

  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<(typeof ORDER_STATUSES)[number], number>;
  for (const r of statusRows) statusCounts[r.status] = r.n;

  return { current, previous, series, statusCounts, recent, top, lowStock, pendingCount: pending[0]?.n ?? 0 };
}

export async function getPendingOrderCount() {
  const [row] = await db.select({ n: count() }).from(orders).where(eq(orders.status, "pending"));
  return row?.n ?? 0;
}

/* ---------- Orders ---------- */

export type OrderFilters = { q?: string; status?: string; payment?: string; page: number };

export async function listOrders(f: OrderFilters) {
  const conds: SQL[] = [];
  if (f.q) {
    const term = `%${f.q}%`;
    conds.push(or(like(orders.orderNo, term), like(orders.customerName, term), like(orders.phone, term))!);
  }
  if (f.payment && ["cod", "bkash", "nagad", "card"].includes(f.payment)) {
    conds.push(eq(orders.paymentMethod, f.payment as (typeof orders.paymentMethod.enumValues)[number]));
  }
  const base = conds.length ? and(...conds) : undefined;
  const statusCond =
    f.status && (ORDER_STATUSES as readonly string[]).includes(f.status)
      ? eq(orders.status, f.status as (typeof ORDER_STATUSES)[number])
      : undefined;
  const where = base && statusCond ? and(base, statusCond) : (base ?? statusCond);

  const [rows, [{ total }], statusRows] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        customerName: orders.customerName,
        phone: orders.phone,
        division: orders.division,
        total: orders.total,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        items: sql<number>`(SELECT COALESCE(SUM(${orderItems.qty}), 0) FROM ${orderItems} WHERE ${orderItems.orderId} = ${orders.id})`.mapWith(Number),
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(orders).where(where),
    db.select({ status: orders.status, n: count() }).from(orders).where(base).groupBy(orders.status),
  ]);

  const statusCounts: Record<string, number> = { all: 0 };
  for (const r of statusRows) {
    statusCounts[r.status] = r.n;
    statusCounts.all += r.n;
  }
  return { rows, total, statusCounts };
}

export async function getOrderDetail(id: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const [items, [history]] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.id)),
    db
      .select({ n: count(), spent: sum(orders.total).mapWith(Number) })
      .from(orders)
      .where(and(eq(orders.phone, order.phone), notCancelled)),
  ]);
  return { order, items, customerOrders: history?.n ?? 0, customerSpent: history?.spent ?? 0 };
}

/* ---------- Products ---------- */

export type ProductFilters = { q?: string; category?: string; status?: string; page: number };

export async function listProducts(f: ProductFilters) {
  const conds: SQL[] = [];
  if (f.q) conds.push(or(like(products.name, `%${f.q}%`), like(products.slug, `%${f.q}%`))!);
  if (f.category) conds.push(eq(categories.slug, f.category));
  if (f.status === "active") conds.push(eq(products.isActive, true));
  if (f.status === "hidden") conds.push(eq(products.isActive, false));
  if (f.status === "low") conds.push(lte(products.stock, 10));
  const where = conds.length ? and(...conds) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        image: products.image,
        emoji: products.emoji,
        tint: products.tint,
        stock: products.stock,
        isActive: products.isActive,
        isPopular: products.isPopular,
        isDailyBest: products.isDailyBest,
        categoryName: categories.name,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(asc(products.sortOrder), desc(products.id))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(where),
  ]);

  const variants = rows.length
    ? await db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, rows.map((r) => r.id)))
        .orderBy(asc(productVariants.sortOrder), asc(productVariants.id))
    : [];

  return {
    total,
    rows: rows.map((r) => {
      const vs = variants.filter((v) => v.productId === r.id);
      return { ...r, price: vs[0]?.price ?? 0, oldPrice: vs[0]?.oldPrice ?? null, variantCount: vs.length };
    }),
  };
}

export async function getProductForEdit(id: number) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return null;
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.id));
  return { product, variants };
}

/* ---------- Categories & coupons ---------- */

export async function listCategoriesWithCounts() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
      productCount: sql<number>`(SELECT COUNT(*) FROM ${products} WHERE ${products.categoryId} = ${categories.id})`.mapWith(Number),
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function listCoupons() {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function listSliders() {
  return db
    .select({ id: sliders.id, title: sliders.title, image: sliders.image, link: sliders.link, sortOrder: sliders.sortOrder, isActive: sliders.isActive })
    .from(sliders)
    .orderBy(asc(sliders.sortOrder), asc(sliders.id));
}

/* ---------- Customers (derived from orders, grouped by phone) ---------- */

export async function listCustomers(f: { q?: string; page: number }) {
  const where = f.q ? or(like(orders.customerName, `%${f.q}%`), like(orders.phone, `%${f.q}%`)) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        phone: orders.phone,
        name: sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(${orders.customerName} ORDER BY ${orders.createdAt} DESC SEPARATOR '\n'), '\n', 1)`,
        email: sql<string>`MAX(${orders.email})`,
        location: sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(CONCAT(${orders.area}, ', ', ${orders.division}) ORDER BY ${orders.createdAt} DESC SEPARATOR '\n'), '\n', 1)`,
        orders: count(),
        spent: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} <> 'cancelled' THEN ${orders.total} END), 0)`.mapWith(Number),
        lastOrder: sql<Date>`MAX(${orders.createdAt})`.mapWith(toUtcDate),
      })
      .from(orders)
      .where(where)
      .groupBy(orders.phone)
      .orderBy(desc(sql`MAX(${orders.createdAt})`))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`COUNT(DISTINCT ${orders.phone})`.mapWith(Number) }).from(orders).where(where),
  ]);
  return { rows, total };
}

/* ---------- Blog ---------- */

const { posts, postCategories, postTags, postTagLinks, postComments, admins } = schema;

export type PostFilters = { q?: string; status?: string; category?: string; tag?: string; page: number };

export async function listPosts(f: PostFilters) {
  const now = new Date();
  const conds: SQL[] = [];
  if (f.q) conds.push(or(like(posts.title, `%${f.q}%`), like(posts.slug, `%${f.q}%`))!);
  if (f.category === "none") conds.push(sql`${posts.categoryId} IS NULL`);
  else if (f.category) conds.push(eq(postCategories.slug, f.category));
  if (f.tag) {
    conds.push(
      sql`EXISTS (SELECT 1 FROM ${postTagLinks} INNER JOIN ${postTags} ON ${postTags.id} = ${postTagLinks.tagId} WHERE ${postTagLinks.postId} = ${posts.id} AND ${postTags.slug} = ${f.tag})`,
    );
  }
  const base = conds.length ? and(...conds) : undefined;

  const statusConds: Record<string, SQL> = {
    published: and(eq(posts.status, "published"), lte(posts.publishedAt, now))!,
    scheduled: and(eq(posts.status, "published"), sql`${posts.publishedAt} > ${now}`)!,
    draft: eq(posts.status, "draft"),
  };
  const statusCond = f.status ? statusConds[f.status] : undefined;
  const where = base && statusCond ? and(base, statusCond) : (base ?? statusCond);

  const [rows, [{ total }], [counts]] = await Promise.all([
    db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        coverImage: posts.coverImage,
        status: posts.status,
        isScheduled: sql<boolean>`${statusConds.scheduled}`.mapWith((v) => Number(v) === 1),
        publishedAt: posts.publishedAt,
        updatedAt: posts.updatedAt,
        categoryName: postCategories.name,
        authorName: admins.name,
        comments: sql<number>`(SELECT COUNT(*) FROM ${postComments} WHERE ${postComments.postId} = ${posts.id} AND ${postComments.status} = 'approved')`.mapWith(Number),
        pendingComments: sql<number>`(SELECT COUNT(*) FROM ${postComments} WHERE ${postComments.postId} = ${posts.id} AND ${postComments.status} = 'pending')`.mapWith(Number),
      })
      .from(posts)
      .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
      .leftJoin(admins, eq(posts.authorId, admins.id))
      .where(where)
      .orderBy(desc(sql`COALESCE(${posts.publishedAt}, ${posts.createdAt})`), desc(posts.id))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(posts).leftJoin(postCategories, eq(posts.categoryId, postCategories.id)).where(where),
    db
      .select({
        all: count(),
        published: sql<number>`SUM(${statusConds.published})`.mapWith(Number),
        scheduled: sql<number>`SUM(${statusConds.scheduled})`.mapWith(Number),
        draft: sql<number>`SUM(${statusConds.draft})`.mapWith(Number),
      })
      .from(posts)
      .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
      .where(base),
  ]);

  const tags = rows.length
    ? await db
        .select({ postId: postTagLinks.postId, name: postTags.name })
        .from(postTagLinks)
        .innerJoin(postTags, eq(postTags.id, postTagLinks.tagId))
        .where(inArray(postTagLinks.postId, rows.map((r) => r.id)))
        .orderBy(asc(postTags.name))
    : [];

  return {
    total,
    statusCounts: { all: counts?.all ?? 0, published: counts?.published ?? 0, scheduled: counts?.scheduled ?? 0, draft: counts?.draft ?? 0 },
    rows: rows.map((r) => ({ ...r, tags: tags.filter((t) => t.postId === r.id).map((t) => t.name) })),
  };
}

export async function getPostForEdit(id: number) {
  if (!Number.isInteger(id) || id < 1) return null;
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) return null;
  const tags = await db
    .select({ name: postTags.name })
    .from(postTagLinks)
    .innerJoin(postTags, eq(postTags.id, postTagLinks.tagId))
    .where(eq(postTagLinks.postId, id))
    .orderBy(asc(postTags.name));
  return { post, tags: tags.map((t) => t.name) };
}

export async function listPostCategories() {
  return db
    .select({
      id: postCategories.id,
      slug: postCategories.slug,
      name: postCategories.name,
      description: postCategories.description,
      sortOrder: postCategories.sortOrder,
      postCount: sql<number>`(SELECT COUNT(*) FROM ${posts} WHERE ${posts.categoryId} = ${postCategories.id})`.mapWith(Number),
    })
    .from(postCategories)
    .orderBy(asc(postCategories.sortOrder), asc(postCategories.name));
}

export async function listTags() {
  return db
    .select({
      id: postTags.id,
      slug: postTags.slug,
      name: postTags.name,
      postCount: sql<number>`(SELECT COUNT(*) FROM ${postTagLinks} WHERE ${postTagLinks.tagId} = ${postTags.id})`.mapWith(Number),
    })
    .from(postTags)
    .orderBy(asc(postTags.name));
}

export type CommentFilters = { q?: string; status?: string; page: number };

export async function listComments(f: CommentFilters) {
  const base = f.q
    ? or(like(postComments.authorName, `%${f.q}%`), like(postComments.authorEmail, `%${f.q}%`), like(postComments.content, `%${f.q}%`), like(posts.title, `%${f.q}%`))
    : undefined;
  const statusCond =
    f.status && (COMMENT_STATUSES as readonly string[]).includes(f.status)
      ? eq(postComments.status, f.status as (typeof COMMENT_STATUSES)[number])
      : undefined;
  const where = base && statusCond ? and(base, statusCond) : (base ?? statusCond);

  const [rows, [{ total }], statusRows] = await Promise.all([
    db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        parentId: postComments.parentId,
        isAdmin: sql<boolean>`${postComments.adminId} IS NOT NULL`.mapWith(Boolean),
        authorName: postComments.authorName,
        authorEmail: postComments.authorEmail,
        content: postComments.content,
        status: postComments.status,
        createdAt: postComments.createdAt,
        postTitle: posts.title,
        postSlug: posts.slug,
      })
      .from(postComments)
      .innerJoin(posts, eq(posts.id, postComments.postId))
      .where(where)
      .orderBy(desc(postComments.createdAt), desc(postComments.id))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(postComments).innerJoin(posts, eq(posts.id, postComments.postId)).where(where),
    db.select({ status: postComments.status, n: count() }).from(postComments).innerJoin(posts, eq(posts.id, postComments.postId)).where(base).groupBy(postComments.status),
  ]);

  const statusCounts: Record<string, number> = { all: 0 };
  for (const r of statusRows) {
    statusCounts[r.status] = r.n;
    statusCounts.all += r.n;
  }
  return { rows, total, statusCounts };
}

export async function getPendingCommentCount() {
  const [row] = await db.select({ n: count() }).from(postComments).where(eq(postComments.status, "pending"));
  return row?.n ?? 0;
}

/* ---------- Pages ---------- */

export type PageFilters = { q?: string; status?: string; page: number };

export async function listPages(f: PageFilters) {
  const { pages } = schema;
  const now = new Date();
  const base = f.q ? or(like(pages.title, `%${f.q}%`), like(pages.slug, `%${f.q}%`)) : undefined;
  const statusConds: Record<string, SQL> = {
    live: and(eq(pages.isActive, true), lte(pages.publishedAt, now))!,
    scheduled: and(eq(pages.isActive, true), sql`${pages.publishedAt} > ${now}`)!,
    hidden: eq(pages.isActive, false),
    featured: eq(pages.isFeatured, true),
  };
  const statusCond = f.status ? statusConds[f.status] : undefined;
  const where = base && statusCond ? and(base, statusCond) : (base ?? statusCond);

  const [rows, [{ total }], [counts]] = await Promise.all([
    db
      .select({
        id: pages.id,
        slug: pages.slug,
        title: pages.title,
        image: pages.image,
        banner: pages.banner,
        template: pages.template,
        isActive: pages.isActive,
        isFeatured: pages.isFeatured,
        isScheduled: sql<boolean>`${statusConds.scheduled}`.mapWith((v) => Number(v) === 1),
        publishedAt: pages.publishedAt,
        updatedAt: pages.updatedAt,
        sortOrder: pages.sortOrder,
        authorName: admins.name,
      })
      .from(pages)
      .leftJoin(admins, eq(pages.authorId, admins.id))
      .where(where)
      .orderBy(asc(pages.sortOrder), asc(pages.title))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(pages).where(where),
    db
      .select({
        all: count(),
        live: sql<number>`SUM(${statusConds.live})`.mapWith(Number),
        scheduled: sql<number>`SUM(${statusConds.scheduled})`.mapWith(Number),
        hidden: sql<number>`SUM(${statusConds.hidden})`.mapWith(Number),
        featured: sql<number>`SUM(${statusConds.featured})`.mapWith(Number),
      })
      .from(pages)
      .where(base),
  ]);
  return {
    rows,
    total,
    statusCounts: {
      all: counts?.all ?? 0,
      live: counts?.live ?? 0,
      scheduled: counts?.scheduled ?? 0,
      hidden: counts?.hidden ?? 0,
      featured: counts?.featured ?? 0,
    },
  };
}

export async function getPageForEdit(id: number) {
  if (!Number.isInteger(id) || id < 1) return null;
  const [page] = await db.select().from(schema.pages).where(eq(schema.pages.id, id)).limit(1);
  return page ?? null;
}

/* ---------- Menus ---------- */

/** Menus list: one row per menu with its item count and creator. */
export async function listMenus() {
  const { menus, menuItems } = schema;
  return db
    .select({
      id: menus.id,
      name: menus.name,
      location: menus.location,
      isActive: menus.isActive,
      creatorName: admins.name,
      updatedAt: menus.updatedAt,
      items: sql<number>`(SELECT COUNT(*) FROM ${menuItems} WHERE ${menuItems.menuId} = ${menus.id})`.mapWith(Number),
    })
    .from(menus)
    .leftJoin(admins, eq(menus.createdBy, admins.id))
    .orderBy(asc(menus.id));
}

export async function getMenuForEdit(id: number) {
  if (!Number.isInteger(id) || id < 1) return null;
  const { menus, menuItems } = schema;
  const [menu] = await db.select().from(menus).where(eq(menus.id, id)).limit(1);
  if (!menu) return null;
  const items = await db.select().from(menuItems).where(eq(menuItems.menuId, id)).orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
  return {
    id: menu.id,
    name: menu.name,
    location: menu.location,
    isActive: menu.isActive,
    items: items.map((i) => ({
      type: i.type,
      refId: i.refId,
      label: i.label,
      url: i.url,
      openInNewTab: i.openInNewTab,
      depth: (i.parentId ? 1 : 0) as 0 | 1,
    })),
  };
}

/** Everything that can be added to a menu, for the "Add items" panels. */
export async function getMenuItemOptions() {
  const [pageRows, productCats, postCats, postRows] = await Promise.all([
    db.select({ id: schema.pages.id, title: schema.pages.title, isActive: schema.pages.isActive }).from(schema.pages).orderBy(asc(schema.pages.sortOrder), asc(schema.pages.title)),
    db.select({ id: categories.id, title: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select({ id: postCategories.id, title: postCategories.name }).from(postCategories).orderBy(asc(postCategories.sortOrder), asc(postCategories.name)),
    db.select({ id: posts.id, title: posts.title, status: posts.status }).from(posts).orderBy(desc(posts.publishedAt)).limit(200),
  ]);
  return {
    page: pageRows.map((p) => ({ id: p.id, title: p.title, note: p.isActive ? undefined : "hidden" })),
    product_category: productCats,
    post_category: postCats,
    post: postRows.map((p) => ({ id: p.id, title: p.title, note: p.status === "draft" ? "draft" : undefined })),
  };
}

/* ---------- Users management ---------- */

export async function listAdmins() {
  const { roles } = schema;
  return db
    .select({
      id: admins.id,
      name: admins.name,
      email: admins.email,
      roleId: admins.roleId,
      roleName: roles.name,
      isSuperAdmin: sql<boolean>`COALESCE(JSON_CONTAINS(${roles.permissions}, '"*"'), 0)`.mapWith((v) => Number(v) === 1),
      isActive: admins.isActive,
      lastLoginAt: admins.lastLoginAt,
      createdAt: admins.createdAt,
    })
    .from(admins)
    .leftJoin(roles, eq(roles.id, admins.roleId))
    .orderBy(asc(admins.name));
}

export async function listRoles() {
  const { roles } = schema;
  return db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      permissions: roles.permissions,
      isSystem: roles.isSystem,
      adminCount: sql<number>`(SELECT COUNT(*) FROM ${admins} WHERE ${admins.roleId} = ${roles.id})`.mapWith(Number),
    })
    .from(roles)
    .orderBy(desc(roles.isSystem), asc(roles.name));
}

export async function listRegisteredCustomers(f: { q?: string; status?: string; page: number }) {
  const { customers } = schema;
  const conds: SQL[] = [];
  if (f.q) conds.push(or(like(customers.name, `%${f.q}%`), like(customers.phone, `%${f.q}%`), like(customers.email, `%${f.q}%`))!);
  if (f.status === "active") conds.push(eq(customers.isActive, true));
  if (f.status === "blocked") conds.push(eq(customers.isActive, false));
  const where = conds.length ? and(...conds) : undefined;

  const [rows, [{ total }], [counts]] = await Promise.all([
    db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        division: customers.division,
        area: customers.area,
        isActive: customers.isActive,
        lastLoginAt: customers.lastLoginAt,
        createdAt: customers.createdAt,
        orders: sql<number>`(SELECT COUNT(*) FROM ${orders} WHERE ${orders.customerId} = ${customers.id})`.mapWith(Number),
        spent: sql<number>`(SELECT COALESCE(SUM(${orders.total}), 0) FROM ${orders} WHERE ${orders.customerId} = ${customers.id} AND ${orders.status} <> 'cancelled')`.mapWith(Number),
      })
      .from(customers)
      .where(where)
      .orderBy(desc(customers.createdAt))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(customers).where(where),
    db
      .select({ all: count(), blocked: sql<number>`SUM(${customers.isActive} = 0)`.mapWith(Number) })
      .from(customers)
      .where(f.q ? conds[0] : undefined),
  ]);
  return { rows, total, counts: { all: counts?.all ?? 0, active: (counts?.all ?? 0) - (counts?.blocked ?? 0), blocked: counts?.blocked ?? 0 } };
}

export async function listSubscribers(f: { q?: string; status?: string; page: number }) {
  const { subscribers } = schema;
  const search = f.q ? or(like(subscribers.email, `%${f.q}%`), like(subscribers.name, `%${f.q}%`)) : undefined;
  const statusCond = f.status === "subscribed" || f.status === "unsubscribed" ? eq(subscribers.status, f.status) : undefined;
  const where = search && statusCond ? and(search, statusCond) : (search ?? statusCond);

  const [rows, [{ total }], [counts]] = await Promise.all([
    db.select().from(subscribers).where(where).orderBy(desc(subscribers.createdAt)).limit(PAGE_SIZE).offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(subscribers).where(where),
    db
      .select({ all: count(), subscribed: sql<number>`SUM(${subscribers.status} = 'subscribed')`.mapWith(Number) })
      .from(subscribers)
      .where(search),
  ]);
  const all = counts?.all ?? 0;
  const subscribed = counts?.subscribed ?? 0;
  return { rows, total, counts: { all, subscribed, unsubscribed: all - subscribed } };
}

/** Every subscriber matching the status filter, for CSV export. */
export async function exportSubscribers(status?: string) {
  const { subscribers } = schema;
  return db
    .select({ email: subscribers.email, name: subscribers.name, status: subscribers.status, source: subscribers.source, createdAt: subscribers.createdAt })
    .from(subscribers)
    .where(status === "subscribed" || status === "unsubscribed" ? eq(subscribers.status, status) : undefined)
    .orderBy(desc(subscribers.createdAt));
}
