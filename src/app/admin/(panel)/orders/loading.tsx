import { TablePageSkeleton } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return <TablePageSkeleton label="Loading orders…" tabs cols={6} />;
}
