"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { MENU_ITEM_TYPES, MENU_LOCATION_LABELS, MENU_LOCATIONS } from "@/lib/constants";
import { requireAdmin } from "../auth";
import { firstErrors, type FormState } from "./form-state";

const { menus, menuItems } = schema;

/** Site paths ("/blog"), anchors ("#footer"), full http(s) links, mailto: and tel:. */
const safeUrl = (v: string) => /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(v);

const itemSchema = z
  .object({
    type: z.enum(MENU_ITEM_TYPES),
    refId: z.number().int().positive().nullable(),
    label: z.string().trim().min(1, "Every item needs a label").max(120),
    url: z.string().trim().max(500),
    openInNewTab: z.boolean(),
    depth: z.union([z.literal(0), z.literal(1)]),
  })
  .refine((i) => (i.type === "custom" ? safeUrl(i.url) : i.refId !== null), {
    message: "Custom links need a URL like /products, #footer or https://…",
  });

const menuSchema = z.object({
  name: z.string().trim().min(2, "Menu name is required").max(120),
  location: z.preprocess((v) => (v ? v : null), z.enum(MENU_LOCATIONS).nullable()),
  isActive: z.boolean(),
  items: z.preprocess(
    (v) => {
      try {
        return JSON.parse(String(v ?? "[]"));
      } catch {
        return null;
      }
    },
    z.array(itemSchema).max(100, "A menu can have up to 100 items"),
  ),
});

function revalidateMenus() {
  revalidatePath("/admin/menus");
  // Menus render in the header/footer of every store page.
  revalidatePath("/", "layout");
}

export async function saveMenu(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("menus");
  const id = Number(formData.get("id")) || null;
  const parsed = menuSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    isActive: formData.get("isActive") === "on",
    items: formData.get("items"),
  });
  if (!parsed.success) {
    const errors = firstErrors(parsed.error);
    // Item-level problems are reported once, under the item list.
    const itemIssue = parsed.error.issues.find((i) => i.path[0] === "items");
    if (itemIssue) errors.items = itemIssue.message;
    return { ok: false, message: errors.items ?? "Please fix the highlighted fields.", errors };
  }
  const { items, ...data } = parsed.data;

  if (id) {
    const [exists] = await db.select({ id: menus.id }).from(menus).where(eq(menus.id, id)).limit(1);
    if (!exists) return { ok: false, message: "This menu no longer exists." };
  }

  let menuId = id;
  let moved = false;
  await db.transaction(async (tx) => {
    // One active menu per location: an older menu there gets unassigned.
    if (data.location && data.isActive) {
      const [res] = await tx
        .update(menus)
        .set({ location: null })
        .where(and(eq(menus.location, data.location), eq(menus.isActive, true), id ? ne(menus.id, id) : undefined));
      moved = res.affectedRows > 0;
    }
    if (menuId) {
      await tx.update(menus).set(data).where(eq(menus.id, menuId));
      await tx.delete(menuItems).where(eq(menuItems.menuId, menuId));
    } else {
      [{ id: menuId }] = await tx.insert(menus).values({ ...data, createdBy: admin.id }).$returningId();
    }

    // Insert in order; a depth-1 item belongs to the closest top-level item before it.
    let parentId: number | null = null;
    for (const [sortOrder, item] of items.entries()) {
      const [{ id: itemId }] = await tx
        .insert(menuItems)
        .values({
          menuId: menuId!,
          parentId: item.depth === 1 ? parentId : null,
          type: item.type,
          refId: item.type === "custom" ? null : item.refId,
          label: item.label,
          url: item.type === "custom" ? item.url : "",
          openInNewTab: item.openInNewTab,
          sortOrder,
        })
        .$returningId();
      if (item.depth === 0) parentId = itemId;
    }
  });

  revalidateMenus();
  const where = data.location ? ` It now shows in “${MENU_LOCATION_LABELS[data.location]}”.` : " It has no location yet, so the store doesn’t show it.";
  return {
    ok: true,
    message: `${id ? "Menu saved." : "Menu created."}${data.isActive ? where : " It is inactive, so the store doesn’t show it."}${
      moved ? " The menu that was there before is now unassigned." : ""
    }`,
    id: menuId!,
  };
}

export async function deleteMenu(id: number): Promise<FormState> {
  await requireAdmin("menus");
  await db.delete(menus).where(eq(menus.id, id));
  revalidateMenus();
  return { ok: true, message: "Menu deleted. The store falls back to its default links there." };
}
