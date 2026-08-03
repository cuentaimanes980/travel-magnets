import { requireAdmin } from "@/lib/admin/auth";
import { getAdminTrip } from "@/lib/admin/data";
import { saveDay } from "@/lib/admin/actions";

export default async function AdminDaysPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { client } = await requireAdmin();
  const { tripId } = await params;
  const trip = await getAdminTrip(client, tripId);
  if (!trip) return null;
  return <section className="admin-section"><div className="admin-page-heading"><div><span className="section-label">{trip.title}</span><h1>Jornadas</h1><p>Actualiza el relato sin tocar las tablas directamente.</p></div></div><div className="admin-editor-stack">{trip.days.map((day) => <form className="admin-editor-card" action={saveDay} key={day.id}><input type="hidden" name="tripSlug" value={trip.slug} /><input type="hidden" name="dayId" value={day.id} /><div className="editor-card-heading"><span className="day-number">Día {day.dayNumber}</span><strong>{day.date}</strong></div><div className="admin-form-grid"><label>Fecha<input type="date" name="date" defaultValue={day.date} required /></label><label>Titulo<input name="title" defaultValue={day.title} required /></label><label>Ciudad o tramo<input name="location" defaultValue={day.location} required /></label><label>Fase<input name="phase" defaultValue={day.phase} /></label><label className="field-wide">Resumen<textarea name="summary" defaultValue={day.summary} rows={3} /></label></div><button type="submit" className="admin-primary-link">Guardar jornada</button></form>)}</div></section>;
}

