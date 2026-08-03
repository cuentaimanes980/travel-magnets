import Image from "next/image";
import Link from "next/link";
import { PlaceLocation } from "@/components/travel/PlaceLocation";
import { TravelGallery } from "@/components/travel/TravelGallery";
import type { MediaItem } from "@/types/travel";
import type { PlacePageData } from "@/lib/travel-data/types";
import { dedupeMedia } from "@/lib/travel-data/media-selection";

function PlaceCover({ media }: { media?: MediaItem }) {
  if (!media) return <div className="place-cover place-cover--empty"><span>Sin fotografia asociada</span></div>;
  if (media.type === "video") return <div className="place-cover"><video controls playsInline muted preload="metadata" poster={media.poster} aria-label={media.alt}><source src={media.src} type="video/mp4" /></video></div>;
  return <div className="place-cover"><Image src={media.src} alt={media.alt} fill priority unoptimized sizes="(min-width: 900px) 60rem, 100vw" style={{ objectFit: "cover", objectPosition: media.focus ? `${media.focus.x}% ${media.focus.y}%` : "50% 50%" }} /></div>;
}

function mediaSummary(items: MediaItem[]) {
  const photos = items.filter((item) => item.type === "image").length;
  const videos = items.filter((item) => item.type === "video").length;
  return `${photos} ${photos === 1 ? "foto" : "fotos"} · ${videos} ${videos === 1 ? "video" : "videos"}`;
}

function formatPlaceDate(date: string) {
  return date ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00Z`)) : "Fecha no disponible";
}

export function PlacePageDocument({ page }: { page: PlacePageData }) {
  const { place, media, day, previousPlace, nextPlace, trip } = page;
  const uniqueMedia = dedupeMedia(media);
  const coverId = place.coverMediaIds[0];
  const cover = uniqueMedia.find((item) => item.id === coverId) ?? uniqueMedia[0];
  const secondaryMedia = uniqueMedia.filter((item) => item.id !== cover?.id);
  const base = `/viajes/${trip.slug}`;
  return <main className="place-page" id="top">
    <div className="place-topbar"><Link href={day ? `${base}#${day.id}` : base}>← {day ? `Volver a Dia ${day.dayNumber} · ${day.title}` : "Volver al album"}</Link></div>
    <PlaceCover media={cover} />
    <article className="place-content">
      <span className="section-label">{place.category}</span><h1>{place.name}</h1>
      {place.alternateName && <p className="place-alternate">{place.alternateName}</p>}
      <div className="place-meta"><span>{place.zone}</span><time dateTime={place.date}>{formatPlaceDate(place.date)}</time></div>
      <p className="place-summary">{place.shortSummary}</p><p className="place-description">{place.description}</p>
      {place.wikipediaUrl && <p><a className="place-wikipedia-link" href={place.wikipediaUrl} target="_blank" rel="noopener noreferrer">Ver en Wikipedia</a></p>}
      <PlaceLocation place={place} />
      <section className="place-day-ref"><span className="section-label">Jornada</span><strong>{day ? `Dia ${day.dayNumber} · ${day.title}` : trip.title}</strong><Link href={day ? `${base}#${day.id}` : base}>Ver el dia completo →</Link></section>
      {secondaryMedia.length > 0 && <TravelGallery items={secondaryMedia} title="Medios asociados" summary={mediaSummary(secondaryMedia)} label="Ver fotos y videos asociados" />}
      <nav className="place-navigation" aria-label="Navegacion entre lugares"><Link href={previousPlace ? `${base}/lugares/${previousPlace.slug}` : "#top"}>{previousPlace ? `← ${previousPlace.name}` : "Inicio de lugares"}</Link><Link href={day ? `${base}#${day.id}` : base}>Volver al dia</Link><Link href={nextPlace ? `${base}/lugares/${nextPlace.slug}` : "#top"}>{nextPlace ? `${nextPlace.name} →` : "Fin de lugares"}</Link></nav>
    </article>
  </main>;
}
