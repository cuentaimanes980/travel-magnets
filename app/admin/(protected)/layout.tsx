import { requireAdmin } from "@/lib/admin/auth";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return children;
}
