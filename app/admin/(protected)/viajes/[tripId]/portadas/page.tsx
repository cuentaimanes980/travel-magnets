import { requireAdmin } from "@/lib/admin/auth";
import { getAdminTrip } from "@/lib/admin/data";
import { activateHeroSet } from "@/lib/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export default async function AdminCoversPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { client } = await requireAdmin();
  const { tripId } = await params;
  const trip = await getAdminTrip(client, tripId);
  if (!trip) return null;
  return <section className="admin-section"><div className="admin-page-heading"><div><span className="section-label">{trip.title}</span><h1>Portadas</h1><p>Elige la variante publica sin duplicar medios.</p></div></div><div className="admin-cover-grid">{trip.heroSets.map((heroSet) => <article className={`admin-cover-card${heroSet.isActive ? " is-active" : ""}`} key={heroSet.id}><div className="admin-cover-preview"><span>Portada {heroSet.name.toUpperCase()}</span><small>{heroSet.layout}</small></div><div><strong>{heroSet.isActive ? "Activa" : "Disponible"}</strong><p>{heroSet.mediaIds.length} medios asignados</p>{!heroSet.isActive && <form action={activateHeroSet}><input type="hidden" name="tripSlug" value={trip.slug} /><input type="hidden" name="heroSetId" value={heroSet.id} /><ConfirmSubmit message="Cambiar la portada activa? El cambio se refleja en la web publica." className="admin-primary-link">Activar portada</ConfirmSubmit></form>}</div></article>)}</div></section>;
}

