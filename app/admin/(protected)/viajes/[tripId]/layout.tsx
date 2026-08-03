import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminTrip } from "@/lib/admin/data";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminTripLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ tripId: string }> }>) {
  const { client } = await requireAdmin();
  const { tripId } = await params;
  const trip = await getAdminTrip(client, tripId);
  if (!trip) notFound();
  return <AdminShell tripSlug={trip.slug}>{children}</AdminShell>;
}

