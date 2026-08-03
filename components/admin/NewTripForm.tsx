"use client";

import { useState } from "react";
import Link from "next/link";
import { createTrip } from "@/lib/admin/actions";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function NewTripForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <form action={createTrip} className="admin-editor-card">
      <div className="admin-form-grid">
        <label>Titulo<input name="title" value={title} onChange={(event) => { const nextTitle = event.target.value; setTitle(nextTitle); if (!slugEdited) setSlug(slugify(nextTitle)); }} required autoFocus /></label>
        <label>Slug<input name="slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(event.target.value); }} placeholder="se-genera-desde-el-titulo" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
        <label>Fecha inicial<input type="date" name="startDate" required /></label>
        <label>Fecha final<input type="date" name="endDate" required /></label>
        <label>Modo de portada<select name="heroMode" defaultValue="collage"><option value="collage">Collage</option><option value="slideshow">Slideshow</option><option value="video">Video</option></select></label>
        <label>Tema visual<input name="visualTheme" placeholder="editorial" /></label>
        <label className="field-wide">Resumen<textarea name="summary" rows={4} /></label>
        <label className="field-wide">Ruta visible<textarea name="route" rows={4} placeholder="Ciudad | Tramo o contexto" /></label>
      </div>
      <div className="admin-form-actions"><button className="admin-primary-link" type="submit">Crear borrador</button><Link href="/admin/viajes">Cancelar</Link></div>
    </form>
  );
}
