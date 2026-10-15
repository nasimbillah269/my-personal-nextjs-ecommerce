import { TablePageSkeleton } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return <TablePageSkeleton label="Loading pages…" tabs filters={0} thumb cols={6} action />;
}
