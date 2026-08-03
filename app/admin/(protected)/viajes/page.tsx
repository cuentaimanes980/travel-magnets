import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminTrips } from "@/lib/admin/data";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminTripsPage() {
  const { client } = await requireAdmin();
  const trips = await getAdminTrips(client);
  return <AdminShell><section className="admin-section"><div className="admin-page-heading"><div><span className="section-label">Contenido</span><h1>Viajes</h1></div><Link className="admin-primary-link" href="/admin/viajes/nuevo">Crear viaje</Link></div>
    <div className="admin-trip-grid">{trips.map((trip) => <article className="admin-trip-card" key={trip.id}>
      <div><span className={`admin-status admin-status--${trip.status}`}>{trip.status === "published" ? "Publicado" : trip.status}</span><h2>{trip.title}</h2><p>{trip.startDate} - {trip.endDate}</p></div>
      <div className="admin-card-actions"><Link href={`/admin/viajes/${trip.slug}`}>Editar</Link><Link href={`/viajes/${trip.slug}`} target="_blank">Previsualizar</Link><Link href={`/admin/viajes/${trip.slug}/medios`}>Medios</Link></div>
    </article>)}</div>
  </section></AdminShell>;
}
