import type { TripDay, TripSection } from "@/types/travel";

export function TripIndexNav({ days, sections = [] }: { days: TripDay[]; sections?: TripSection[] }) {
  return <section className="trip-index-overview" id="indice" tabIndex={-1} aria-labelledby="indice-title">
    <div className="section-heading"><span className="section-label">Antes de empezar</span><h2 id="indice-title">Índice del viaje</h2></div>
    <nav aria-label="Índice del viaje" className="trip-index-links">
      {days.map((day) => <a href={`#${day.id}`} key={day.id}><span>Día {day.dayNumber}</span><strong>{day.title}</strong><small>{day.city} · {day.date}</small></a>)}
      {sections.map((section) => <a href={`#section-${section.id}`} key={section.id}><span>Sección especial</span><strong>{section.title}</strong><small>Galería cerrada</small></a>)}
      <a href="#album-completo"><span>Archivo</span><strong>Álbum completo</strong><small>Fotos y vídeos</small></a>
      <a href="#cierre"><span>Final</span><strong>Cierre del viaje</strong><small>Volver al inicio</small></a>
    </nav>
  </section>;
}
