import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceLocation } from "@/components/travel/PlaceLocation";
import { TravelGallery } from "@/components/travel/TravelGallery";
import { getPlacePage, getPlaceSlugs } from "@/lib/travel-data";
import type { MediaItem } from "@/types/travel";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getPlaceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPlacePage(slug);
  return page ? { title: `${page.place.name} · India`, description: page.place.shortSummary } : { title: "Lugar no encontrado" };
}

function PlaceCover({ media }: { media?: MediaItem }) {
  if (!media) return <div className="place-cover place-cover--empty"><span>Sin fotografía asociada</span></div>;
  if (media.type === "video") return <div className="place-cover"><video controls playsInline muted preload="metadata" poster={media.poster} aria-label={media.alt}><source src={media.src} type="video/mp4" /></video></div>;
  return <div className="place-cover"><Image src={media.src} alt={media.alt} fill priority unoptimized={media.src.startsWith("/demo/india/real/")} sizes="(min-width: 900px) 60rem, 100vw" style={{ objectFit: "cover", objectPosition: media.focus ? `${media.focus.x}% ${media.focus.y}%` : "50% 50%" }} /></div>;
}

function mediaSummary(items: MediaItem[]) {
  const photos = items.filter((item) => item.type === "image").length;
  const videos = items.filter((item) => item.type === "video").length;
  return `${photos} ${photos === 1 ? "foto" : "fotos"} · ${videos} ${videos === 1 ? "vídeo" : "vídeos"}`;
}

function formatPlaceDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
}

export default async function PlacePage({ params }: Props) {
  const { slug } = await params;
  const page = await getPlacePage(slug);
  if (!page) notFound();
  const { place, media, day, previousPlace, nextPlace } = page;
  const coverId = place.coverMediaIds[0];
  const cover = media.find((item) => item.id === coverId) ?? media[0];
  const secondaryMedia = media.filter((item) => item.id !== cover?.id);

  return <main className="place-page" id="top">
    <div className="place-topbar"><Link href={day ? `/viajes/india#${day.id}` : "/viajes/india"}>← {day ? `Volver a Día ${day.dayNumber} · ${day.title}` : "Volver al álbum"}</Link></div>
    <PlaceCover media={cover} />
    <article className="place-content">
      <span className="section-label">{place.category}</span>
      <h1>{place.name}</h1>
      {place.alternateName && <p className="place-alternate">{place.alternateName}</p>}
      <div className="place-meta"><span>{place.zone}</span><time dateTime={place.date}>{formatPlaceDate(place.date)}</time></div>
      <p className="place-summary">{place.shortSummary}</p>
      <p className="place-description">{place.description}</p>
      <PlaceLocation place={place} />
      <section className="place-day-ref"><span className="section-label">Jornada</span><strong>{day ? `Día ${day.dayNumber} · ${day.title}` : "India"}</strong><Link href={day ? `/viajes/india#${day.id}` : "/viajes/india"}>Ver el día completo →</Link></section>
      {secondaryMedia.length > 0 && <TravelGallery items={secondaryMedia} title="Medios asociados" summary={mediaSummary(secondaryMedia)} label="Ver fotos y vídeos asociados" />}
      <nav className="place-navigation" aria-label="Navegación entre lugares"><Link href={previousPlace ? `/viajes/india/lugares/${previousPlace.slug}` : "#top"} aria-disabled={!previousPlace}>{previousPlace ? `← ${previousPlace.name}` : "Inicio de lugares"}</Link><Link href={day ? `/viajes/india#${day.id}` : "/viajes/india"}>Volver al día</Link><Link href={nextPlace ? `/viajes/india/lugares/${nextPlace.slug}` : "#top"} aria-disabled={!nextPlace}>{nextPlace ? `${nextPlace.name} →` : "Fin de lugares"}</Link></nav>
    </article>
  </main>;
}
