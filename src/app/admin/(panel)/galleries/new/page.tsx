import { GalleryForm } from "@/components/admin/GalleryForm";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Add gallery" };

export default async function NewGalleryPage() {
  await requireAdmin("galleries");
  return <GalleryForm initial={{ name: "", location: null, description: "", featuredImage: null, isActive: true, images: [] }} />;
}
