/**
 * Copies the bundled product photos (scripts/seed-images/*.webp) into uploads/products
 * and links them to products with the same slug, including photo credits.
 *
 * Photos come from Openverse/Flickr under CC0, CC BY or CC BY-SA — see credits.json.
 * The credit is shown under the product gallery, which those licenses require.
 */
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "../src/db/schema";

const SOURCE_DIR = path.join(process.cwd(), "scripts", "seed-images");
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");

type Credits = Record<string, { credit: string; url: string; license: string }>;

/** Returns how many products were updated. Skips products that already have an image unless `force`. */
export async function attachSeedImages(db: MySql2Database<typeof schema>, { force = false } = {}) {
  const credits = JSON.parse(await readFile(path.join(SOURCE_DIR, "credits.json"), "utf8")) as Credits;
  await mkdir(UPLOAD_DIR, { recursive: true });

  let updated = 0;
  for (const [slug, info] of Object.entries(credits)) {
    const [product] = await db
      .select({ id: schema.products.id, image: schema.products.image })
      .from(schema.products)
      .where(eq(schema.products.slug, slug))
      .limit(1);
    if (!product || (product.image && !force)) continue;

    const file = `${slug}.webp`;
    await copyFile(path.join(SOURCE_DIR, file), path.join(UPLOAD_DIR, file));
    await db
      .update(schema.products)
      .set({
        image: `/media/products/${file}`,
        // Public-domain photos need no credit, but we keep it as a courtesy.
        imageCredit: info.credit,
        imageCreditUrl: info.url,
      })
      .where(eq(schema.products.id, product.id));
    updated++;
  }
  return updated;
}
