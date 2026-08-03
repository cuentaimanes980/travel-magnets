"use client";

/* Direct R2 previews stay outside the Next image proxy in the private editor. */
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { saveMedia } from "@/lib/admin/actions";
import type { AdminDay, AdminMedia, AdminPlace } from "@/lib/admin/data";

const roles = [["day_gallery", "Galeria del dia"], ["day_mosaic", "Mosaico"], ["day_hero", "Foto principal del dia"], ["day_video", "Video destacado"], ["place", "Galeria de lugar"], ["place_cover", "Portada de lugar"], ["closing", "Cierre"]];

export function AdminMediaGrid({ tripSlug, media, days, places }: { tripSlug: string; media: AdminMedia[]; days: AdminDay[]; places: AdminPlace[] }) {
  const [query, setQuery] = useState("");
  const [review, setReview] = useState("all");
  const [kind, setKind] = useState("all");
  const [orientation, setOrientation] = useState("all");
  const [city, setCity] = useState("all");
  const [day, setDay] = useState("all");
  const [place, setPlace] = useState("all");
  const cities = [...new Set(media.map((item) => item.city).filter(Boolean))];
  const filtered = useMemo(() => media.filter((item) => {
    const haystack = `${item.originalFileName} ${item.alt} ${item.description}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (review === "all" || item.reviewStatus === review) && (kind === "all" || item.mediaType === kind) && (orientation === "all" || item.orientation === orientation) && (city === "all" || item.city === city) && (day === "all" || item.assignments.some((assignment) => assignment.dayId === day)) && (place === "all" || item.assignments.some((assignment) => assignment.placeId === place));
  }), [media, query, review, kind, orientation, city, day, place]);
  return <div className="media-manager">
    <div className="media-filters"><label>Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o descripcion" /></label><label>Revision<select value={review} onChange={(event) => setReview(event.target.value)}><option value="all">Todos</option><option value="pending">Pendientes</option><option value="selected">Seleccionados</option><option value="rejected">Descartados</option></select></label><label>Tipo<select value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">Fotos y videos</option><option value="image">Fotos</option><option value="video">Videos</option></select></label><label>Orientacion<select value={orientation} onChange={(event) => setOrientation(event.target.value)}><option value="all">Todas</option><option value="landscape">Horizontal</option><option value="portrait">Vertical</option><option value="square">Cuadrada</option></select></label><label>Ciudad<select value={city} onChange={(event) => setCity(event.target.value)}><option value="all">Todas</option>{cities.map((value) => <option key={value}>{value}</option>)}</select></label><label>Dia<select value={day} onChange={(event) => setDay(event.target.value)}><option value="all">Todos</option>{days.map((value) => <option value={value.id} key={value.id}>Día {value.dayNumber} · {value.title}</option>)}</select></label><label>Lugar<select value={place} onChange={(event) => setPlace(event.target.value)}><option value="all">Todos</option>{places.map((value) => <option value={value.id} key={value.id}>{value.name}</option>)}</select></label></div>
    <p className="media-result-count">{filtered.length} de {media.length} medios</p>
    <div className="media-grid">{filtered.map((item) => <MediaCard key={item.id} item={item} tripSlug={tripSlug} days={days} places={places} />)}</div>
  </div>;
}

function MediaCard({ item, tripSlug, days, places }: { item: AdminMedia; tripSlug: string; days: AdminDay[]; places: AdminPlace[] }) {
  const assignedDay = item.assignments.find((assignment) => assignment.dayId);
  const assignedPlaceIds = item.assignments.map((assignment) => assignment.placeId).filter((value): value is string => Boolean(value));
  const assignedRoles = item.assignments.map((assignment) => assignment.role);
  return <details className="media-card"><summary><div className="media-thumb">{item.previewUrl ? <img src={item.previewUrl} alt={item.alt} /> : <span>{item.mediaType === "video" ? "VIDEO" : "SIN MINIATURA"}</span>}<b className={`review-dot review-dot--${item.reviewStatus}`} /></div><div className="media-card-copy"><strong>{item.originalFileName}</strong><span>{item.mediaType} · {item.orientation} · {item.captureDate || "Fecha no disponible"} {item.captureTime}</span><span>{item.city || "Sin ciudad"} · {assignedDay?.dayTitle || "Sin dia"}</span></div><span className="media-expand">Editar</span></summary>
    <form action={saveMedia} className="media-editor" onSubmit={(event) => { const data = new FormData(event.currentTarget); if (data.get("reviewStatus") === "rejected" && !window.confirm("Descartar este medio? No se borrara de R2.")) event.preventDefault(); }}>
      <input type="hidden" name="tripSlug" value={tripSlug} /><input type="hidden" name="mediaId" value={item.id} />
      <div className="media-editor-preview">{item.previewUrl ? <img src={item.previewUrl} alt={item.alt} /> : <span>Este candidato aun no tiene objeto publico.</span>}</div>
      <div className="media-editor-fields"><label>Archivo original<input value={item.originalFileName} readOnly /></label><label>Alt<input name="alt" defaultValue={item.alt} required /></label><label>Descripcion<input name="description" defaultValue={item.description} /></label><label>Estado<select name="reviewStatus" defaultValue={item.reviewStatus}><option value="pending">Pendiente</option><option value="selected">Seleccionado</option><option value="rejected">Descartado</option></select></label><label>Motivo de exclusion<input name="exclusionReason" defaultValue={item.exclusionReason} /></label><label>Orden<input type="number" min="0" name="displayOrder" defaultValue={item.assignments[0]?.displayOrder ?? 0} /></label><label>Focus X<input type="number" min="0" max="100" name="focusX" defaultValue={item.focusX} /></label><label>Focus Y<input type="number" min="0" max="100" name="focusY" defaultValue={item.focusY} /></label><label>Jornada<select name="dayId" defaultValue={assignedDay?.dayId ?? ""}><option value="">Sin jornada</option>{days.map((value) => <option value={value.id} key={value.id}>Día {value.dayNumber} · {value.title}</option>)}</select></label></div>
      <fieldset><legend>Roles actuales</legend><div className="admin-check-grid">{roles.map(([value, label]) => <label key={value}><input type="checkbox" name="role" value={value} defaultChecked={assignedRoles.includes(value)} />{label}</label>)}</div></fieldset>
      <fieldset><legend>Lugares asignados</legend><div className="admin-check-grid">{places.map((value) => <label key={value.id}><input type="checkbox" name="placeId" value={value.id} defaultChecked={assignedPlaceIds.includes(value.id)} />{value.name}</label>)}</div></fieldset>
      <div className="media-editor-actions"><button type="submit" className="admin-primary-link">Guardar cambios</button><span>{item.width && item.height ? `${item.width} × ${item.height}` : "Dimensiones no disponibles"}</span></div>
    </form>
  </details>;
}
