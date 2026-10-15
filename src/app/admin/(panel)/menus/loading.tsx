import { TablePageSkeleton } from "@/components/admin/AdminSkeletons";

export default function Loading() {
  return <TablePageSkeleton label="Loading menus…" filters={0} cols={5} action />;
}
