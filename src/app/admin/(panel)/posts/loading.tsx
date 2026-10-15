import { TablePageSkeleton } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return <TablePageSkeleton label="Loading posts…" tabs filters={1} thumb cols={6} action />;
}
