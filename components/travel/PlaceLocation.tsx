import type { TripPlace } from "@/types/travel";

export function PlaceLocation({ place }: { place: TripPlace }) {
  const mapHref = place.coordinates
    ? `https://www.openstreetmap.org/?mlat=${place.coordinates.latitude}&mlon=${place.coordinates.longitude}#map=16/${place.coordinates.latitude}/${place.coordinates.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapQuery ?? `${place.name}, ${place.city}, India`)}`;
  return <section className="place-location" aria-label={`Ubicación de ${place.name}`}>
    <span className="section-label">Ubicación</span>
    <strong>{place.zone}</strong>
    <span>{place.city}</span>
    {place.coordinates && <span className="place-coordinates">{place.coordinates.latitude.toFixed(4)}, {place.coordinates.longitude.toFixed(4)}</span>}
    <div className="location-diagram" aria-hidden="true"><span /></div>
    <a className="location-link" href={mapHref} target="_blank" rel="noreferrer">Abrir ubicación en el mapa <span aria-hidden="true">↗</span></a>
  </section>;
}
