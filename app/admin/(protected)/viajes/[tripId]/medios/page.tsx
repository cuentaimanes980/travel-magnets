import { requireAdmin } from "@/lib/admin/auth";
import { getAdminTrip } from "@/lib/admin/data";
import { AdminMediaGrid } from "@/components/admin/AdminMediaGrid";

export default async function AdminMediaPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { client } = await requireAdmin();
  const { tripId } = await params;
  const trip = await getAdminTrip(client, tripId);
  if (!trip) return null;
  return <section className="admin-section"><div className="admin-page-heading"><div><span className="section-label">{trip.title}</span><h1>Medios</h1><p>{trip.media.length} registros, incluidos los candidatos omitidos.</p></div></div><AdminMediaGrid tripSlug={trip.slug} media={trip.media} days={trip.days} places={trip.places} /></section>;
}

