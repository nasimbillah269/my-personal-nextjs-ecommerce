import { TablePageSkeleton } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return <TablePageSkeleton label="Loading comments…" tabs filters={0} thumb cols={2} />;
}
