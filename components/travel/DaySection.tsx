import Link from "next/link";
import { ChapterHeader } from "./ChapterHeader";
import { FullImageBlock } from "./FullImageBlock";
import { ImageGridBlock } from "./ImageGridBlock";
import { ShortVideoBlock } from "./ShortVideoBlock";
import { TravelGallery } from "./TravelGallery";
import type { MediaItem, TripDay } from "@/types/travel";

function gallerySummary(items: MediaItem[]) {
  const photos = items.filter((item) => item.type === "image").length;
  const videos = items.filter((item) => item.type === "video").length;
  return `${photos} ${photos === 1 ? "foto" : "fotos"} · ${videos} ${videos === 1 ? "vídeo" : "vídeos"} de este día`;
}

export function DaySection({ day, nextDay, tripSlug }: { day: TripDay; nextDay?: TripDay; tripSlug: string }) {
  const primaryIds = new Set([day.heroImage.id, ...day.mosaic.map((item) => item.id), day.video?.id]);
  const allDayMedia = [...day.gallery, ...(day.video ? [day.video] : [])];
  const secondaryMedia = allDayMedia.filter((item) => !primaryIds.has(item.id));

  return <section className="day" id={day.id}>
    <ChapterHeader dayNumber={day.dayNumber} title={day.title} summary={day.factualDescription} date={day.date} phase={day.phase} />
    <div className="day-places"><span className="section-label">Lugares del día</span><ul>{day.placesVisited.map((place) => <li key={`${day.id}-${place.name}`}>
      {place.slug ? <Link href={`/viajes/${tripSlug}/lugares/${place.slug}`} className="place-link"><span className="place-link-copy"><strong>{place.name}</strong><span>{place.region}</span></span><span aria-hidden="true">↗</span></Link> : <div className="place-link place-link--static"><span className="place-link-copy"><strong>{place.name}</strong><span>{place.region}</span></span></div>}
    </li>)}</ul></div>
    <FullImageBlock media={day.heroImage} />
    {day.mosaic.length > 0 && <ImageGridBlock items={day.mosaic} />}
    {day.video && <ShortVideoBlock media={day.video} />}
    {secondaryMedia.length > 0 && <TravelGallery items={secondaryMedia} title={`Galería · ${day.city}`} summary={gallerySummary(allDayMedia)} label="Ver las fotografías y vídeos de este día" />}
    {nextDay && <Link className="next-day" href={`#${nextDay.id}`}><span>Siguiente</span><strong>Día {nextDay.dayNumber} · {nextDay.title}</strong><span aria-hidden="true">↓</span></Link>}
  </section>;
}
