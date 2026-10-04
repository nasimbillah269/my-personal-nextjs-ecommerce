import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/** Uploaded files live outside /public (which is fixed at build time) and are served by app/media/[...path]. */
export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

/** Favicons may also be .ico. SVG is deliberately not accepted: it can carry scripts. */
export const FAVICON_TYPES: Record<string, string> = {
  ...IMAGE_TYPES,
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
};

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export function validateImage(
  file: File,
  { types = IMAGE_TYPES, maxBytes = MAX_IMAGE_BYTES, typesLabel = "JPG, PNG, WEBP or AVIF" } = {},
): string | null {
  if (!types[file.type]) return `Upload a ${typesLabel} image.`;
  const limit = maxBytes >= 1024 * 1024 ? `${maxBytes / 1024 / 1024} MB` : `${maxBytes / 1024} KB`;
  if (file.size > maxBytes) return `Image must be ${limit} or smaller.`;
  return null;
}

/** Saves the file and returns its public URL, e.g. /media/products/abc.webp */
export async function saveImage(file: File, folder: "products" | "branding"): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}${FAVICON_TYPES[file.type]}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/media/${folder}/${name}`;
}

export async function deleteImage(publicUrl: string | null | undefined) {
  if (!publicUrl?.startsWith("/media/")) return;
  const file = path.join(UPLOAD_ROOT, ...publicUrl.slice("/media/".length).split("/"));
  if (!file.startsWith(UPLOAD_ROOT + path.sep)) return;
  await unlink(file).catch(() => {});
}
