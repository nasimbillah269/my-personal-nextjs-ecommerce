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

/** Gallery photos may also be animated GIFs. */
export const GALLERY_IMAGE_TYPES: Record<string, string> = {
  ...IMAGE_TYPES,
  "image/gif": ".gif",
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

/** True when the file's first bytes match its declared image type (the browser-sent type alone can be faked). */
function looksLikeImage(buf: Buffer, type: string) {
  const ascii = (start: number, end: number) => buf.subarray(start, end).toString("latin1");
  switch (type) {
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case "image/png":
      return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "image/avif":
      // ISO-BMFF container; the brand may be "avif", "avis" or "mif1".
      return ascii(4, 8) === "ftyp";
    case "image/gif":
      return ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a";
    case "image/x-icon":
    case "image/vnd.microsoft.icon":
      return buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0;
    default:
      return false;
  }
}

/** Saves the file and returns its public URL, e.g. /media/products/abc.webp */
export async function saveImage(file: File, folder: "products" | "branding" | "sliders" | "posts" | "pages" | "galleries" | "clients" | "brands"): Promise<string> {
  const data = Buffer.from(await file.arrayBuffer());
  if (!looksLikeImage(data, file.type)) throw new Error("The uploaded file is not a valid image.");
  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}${FAVICON_TYPES[file.type] ?? GALLERY_IMAGE_TYPES[file.type]}`;
  await writeFile(path.join(dir, name), data);
  return `/media/${folder}/${name}`;
}

export async function deleteImage(publicUrl: string | null | undefined) {
  if (!publicUrl?.startsWith("/media/")) return;
  const file = path.join(UPLOAD_ROOT, ...publicUrl.slice("/media/".length).split("/"));
  if (!file.startsWith(UPLOAD_ROOT + path.sep)) return;
  await unlink(file).catch(() => {});
}
