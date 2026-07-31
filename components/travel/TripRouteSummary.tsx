import type { Place } from "@/types/travel";

export function TripRouteSummary({ places }: { places: Place[] }) {
  return <section className="route" id="ruta"><span className="section-label">Ruta general</span><h2>{places.map((place) => place.name).join(" → ")}</h2><ol className="route-list">{places.map((place, index) => <li key={`${place.name}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{place.name}</strong><span>{place.region}</span></li>)}</ol></section>;
}
