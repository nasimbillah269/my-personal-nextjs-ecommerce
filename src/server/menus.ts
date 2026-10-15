import "server-only";
import { and, asc, eq, inArray, isNotNull, lte } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import type { MenuItemType, MenuLocation } from "@/lib/constants";

const { menus, menuItems, pages, categories, postCategories, posts } = schema;

export type MenuLink = { label: string; href: string; newTab: boolean; children: MenuLink[] };
export type StoreMenus = Partial<Record<MenuLocation, { name: string; items: MenuLink[] }>>;

/** Slugs for every id a menu links to, keyed by item type. Hidden pages and unpublished posts are left out. */
async function resolveRefs(items: { type: MenuItemType; refId: number | null }[]) {
  const ids = (type: MenuItemType) => [...new Set(items.filter((i) => i.type === type && i.refId).map((i) => i.refId!))];
  const now = new Date();
  const load = async (type: MenuItemType, query: (ids: number[]) => Promise<{ id: number; slug: string }[]>) => {
    const list = ids(type);
    return [type, new Map((list.length ? await query(list) : []).map((r) => [r.id, r.slug]))] as const;
  };
  const sel = { id: pages.id, slug: pages.slug };
  return Object.fromEntries(
    await Promise.all([
      load("page", (list) =>
        db.select(sel).from(pages).where(and(inArray(pages.id, list), eq(pages.isActive, true), lte(pages.publishedAt, now))),
      ),
      load("product_category", (list) => db.select({ id: categories.id, slug: categories.slug }).from(categories).where(inArray(categories.id, list))),
      load("post_category", (list) =>
        db.select({ id: postCategories.id, slug: postCategories.slug }).from(postCategories).where(inArray(postCategories.id, list)),
      ),
      load("post", (list) =>
        db
          .select({ id: posts.id, slug: posts.slug })
          .from(posts)
          .where(and(inArray(posts.id, list), eq(posts.status, "published"), lte(posts.publishedAt, now))),
      ),
    ]),
  ) as Record<Exclude<MenuItemType, "custom">, Map<number, string>>;
}

const hrefFor: Record<Exclude<MenuItemType, "custom">, (slug: string) => string> = {
  page: (s) => `/${s}`,
  product_category: (s) => `/products?category=${s}`,
  post_category: (s) => `/blog?category=${s}`,
  post: (s) => `/blog/${s}`,
};

/** Active menus that have a location, as ready-to-render link trees. */
export const getStoreMenus = cache(async (): Promise<StoreMenus> => {
  const active = await db
    .select({ id: menus.id, name: menus.name, location: menus.location })
    .from(menus)
    .where(and(eq(menus.isActive, true), isNotNull(menus.location)));
  if (!active.length) return {};

  const items = await db
    .select()
    .from(menuItems)
    .where(inArray(menuItems.menuId, active.map((m) => m.id)))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
  const refs = await resolveRefs(items);

  const out: StoreMenus = {};
  for (const m of active) {
    const own = items.filter((i) => i.menuId === m.id);
    const toLink = (i: (typeof own)[number]): MenuLink | null => {
      const href = i.type === "custom" ? i.url : refs[i.type].has(i.refId!) ? hrefFor[i.type](refs[i.type].get(i.refId!)!) : null;
      // Links to deleted or hidden content simply drop out of the menu.
      return href ? { label: i.label, href, newTab: i.openInNewTab, children: [] } : null;
    };
    const top: MenuLink[] = [];
    const byId = new Map<number, MenuLink>();
    for (const i of own.filter((x) => !x.parentId)) {
      const link = toLink(i);
      if (link) {
        top.push(link);
        byId.set(i.id, link);
      }
    }
    for (const i of own.filter((x) => x.parentId)) {
      const link = toLink(i);
      if (link) byId.get(i.parentId!)?.children.push(link);
    }
    out[m.location!] = { name: m.name, items: top };
  }
  return out;
});
