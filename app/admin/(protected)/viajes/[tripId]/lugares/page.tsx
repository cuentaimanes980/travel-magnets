import { requireAdmin } from "@/lib/admin/auth";
import { getAdminTrip } from "@/lib/admin/data";
import { savePlace } from "@/lib/admin/actions";

export default async function AdminPlacesPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { client } = await requireAdmin();
  const { tripId } = await params;
  const trip = await getAdminTrip(client, tripId);
  if (!trip) return null;
  return <section className="admin-section"><div className="admin-page-heading"><div><span className="section-label">{trip.title}</span><h1>Lugares</h1><p>{trip.places.length} fichas conectadas al relato.</p></div></div><div className="admin-editor-stack">{trip.places.map((place) => <form className="admin-editor-card" action={savePlace} key={place.id}><input type="hidden" name="tripSlug" value={trip.slug} /><input type="hidden" name="placeId" value={place.id} /><div className="editor-card-heading"><span className="section-label">{place.category}</span><strong>{place.slug}</strong></div><div className="admin-form-grid"><label>Nombre<input name="name" defaultValue={place.name} required /></label><label>Nombre alternativo<input name="alternateName" defaultValue={place.alternateName} /></label><label>Ciudad<input name="city" defaultValue={place.city} required /></label><label>Zona<input name="zone" defaultValue={place.zone} /></label><label>Fecha de visita<input type="date" name="visitDate" defaultValue={place.visitDate} /></label><label>Latitud<input type="number" step="any" name="latitude" defaultValue={place.latitude ?? ""} /></label><label>Longitud<input type="number" step="any" name="longitude" defaultValue={place.longitude ?? ""} /></label><label className="field-wide">Resumen<input name="summary" defaultValue={place.summary} /></label><label className="field-wide">Descripcion<textarea name="description" defaultValue={place.description} rows={4} /></label></div><button type="submit" className="admin-primary-link">Guardar lugar</button></form>)}</div></section>;
}
