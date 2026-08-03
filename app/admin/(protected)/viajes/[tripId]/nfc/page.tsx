import { requireAdmin } from "@/lib/admin/auth";
import { getAdminTrip } from "@/lib/admin/data";
import { deleteNfcLink, saveNfcLink } from "@/lib/admin/actions";
import { NfcQr } from "@/components/admin/NfcQr";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export default async function AdminNfcPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { client } = await requireAdmin();
  const { tripId } = await params;
  const trip = await getAdminTrip(client, tripId);
  if (!trip) return null;
  return <section className="admin-section"><div className="admin-page-heading"><div><span className="section-label">{trip.title}</span><h1>NFC y QR</h1><p>El codigo es estable; activar solo habilita su resolucion publica.</p></div></div><form action={saveNfcLink} className="admin-editor-card"><input type="hidden" name="tripSlug" value={trip.slug} /><div className="admin-form-grid"><label>Nuevo codigo<input name="code" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder={`${trip.slug}-01`} required /></label><input type="hidden" name="isActive" value="false" /></div><button className="admin-primary-link" type="submit">Crear codigo inactivo</button></form><div className="nfc-list">{trip.nfcLinks.map((link) => <article className="nfc-card" key={link.id}><div><strong>{link.code}</strong><span className={`admin-status ${link.isActive ? "admin-status--published" : "admin-status--draft"}`}>{link.isActive ? "Activo" : "Inactivo"}</span><p>{link.isActive ? "Resuelve hacia la web publica." : "No responde para visitantes."}</p></div><NfcQr code={link.code} /><div className="admin-card-actions"><form action={saveNfcLink}><input type="hidden" name="tripSlug" value={trip.slug} /><input type="hidden" name="nfcId" value={link.id} /><input type="hidden" name="code" value={link.code} /><input type="hidden" name="isActive" value={link.isActive ? "false" : "true"} /><ConfirmSubmit className="admin-primary-link" message={link.isActive ? "Desactivar este codigo?" : "Activar este codigo?"}>{link.isActive ? "Desactivar" : "Activar"}</ConfirmSubmit></form><form action={deleteNfcLink}><input type="hidden" name="tripSlug" value={trip.slug} /><input type="hidden" name="nfcId" value={link.id} /><ConfirmSubmit className="admin-secondary-link" message="Eliminar el registro del codigo? La etiqueta fisica no se modifica.">Eliminar registro</ConfirmSubmit></form></div></article>)}</div></section>;
}
