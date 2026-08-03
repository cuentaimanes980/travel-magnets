import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminTrip } from "@/lib/admin/data";

export default async function AdminTripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { client } = await requireAdmin();
  const { tripId } = await params;
  const trip = await getAdminTrip(client, tripId);
  if (!trip) return null;
  const active = trip.media.filter((item) => item.reviewStatus === "selected").length;
  const pending = trip.media.filter((item) => item.reviewStatus === "pending").length;
  return <section className="admin-section"><div className="admin-page-heading"><div><span className="section-label">Viaje</span><h1>{trip.title}</h1><p>{trip.startDate} - {trip.endDate}</p></div><Link className="admin-primary-link" href={`/viajes/${trip.slug}`} target="_blank">Previsualizar</Link></div>
    <p className="admin-lead">{trip.summary}</p>
    <div className="admin-stats"><div><strong>{trip.status === "published" ? "Publicado" : trip.status}</strong><span>Estado</span></div><div><strong>{trip.days.length}</strong><span>Jornadas</span></div><div><strong>{trip.places.length}</strong><span>Lugares</span></div><div><strong>{active}</strong><span>Medios activos</span></div><div><strong>{pending}</strong><span>Pendientes</span></div></div>
    <div className="admin-link-grid"><Link href={`/admin/viajes/${trip.slug}/medios`}><strong>Gestionar medios</strong><span>Revisar, filtrar y asignar el material.</span></Link><Link href={`/admin/viajes/${trip.slug}/dias`}><strong>Editar jornadas</strong><span>Textos, fechas y ruta del diario.</span></Link><Link href={`/admin/viajes/${trip.slug}/lugares`}><strong>Editar lugares</strong><span>Fichas, coordenadas y relaciones.</span></Link><Link href={`/admin/viajes/${trip.slug}/portadas`}><strong>Gestionar portadas</strong><span>Activar una variante A, B, C o D.</span></Link></div>
  </section>;
}

