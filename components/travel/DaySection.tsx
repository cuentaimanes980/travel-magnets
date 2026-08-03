import Image from "next/image";
import Link from "next/link";
import { ChapterHeader } from "./ChapterHeader";
import { FullImageBlock } from "./FullImageBlock";
import { ImageGridBlock } from "./ImageGridBlock";
import { ShortVideoBlock } from "./ShortVideoBlock";
import { TravelGallery } from "./TravelGallery";
import { dedupeMedia, selectVisualMedia } from "@/lib/travel-data/media-selection";
import type { MediaItem, TripDay } from "@/types/travel";

function gallerySummary(items: MediaItem[]) {
  const photos = items.filter((item) => item.type === "image").length;
  const videos = items.filter((item) => item.type === "video").length;
  return `Ver ${photos} ${photos === 1 ? "foto" : "fotos"} · ${videos} ${videos === 1 ? "vídeo" : "vídeos"}`;
}

export function DaySection({ day, nextDay, tripSlug, closingMedia }: { day: TripDay; nextDay?: TripDay; tripSlug: string; closingMedia?: MediaItem }) {
  const mosaic = selectVisualMedia(day.mosaic, { excludeIds: [day.heroImage.id], limit: 4, preferVariety: true });
  const primaryIds = new Set([day.heroImage.id, ...mosaic.map((item) => item.id), day.video?.id]);
  const allDayMedia = dedupeMedia([...day.gallery, ...(day.video ? [day.video] : [])]);
  const secondaryMedia = allDayMedia.filter((item) => !primaryIds.has(item.id));
  const transitionMedia = nextDay?.heroImage ?? closingMedia;

  return <section className="day" id={day.id}>
    <ChapterHeader dayNumber={day.dayNumber} title={day.title} summary={day.factualDescription} date={day.date} phase={day.phase} />
    <div className="day-places"><span className="section-label">Lugares del día</span><ul>{day.placesVisited.map((place) => <li key={`${day.id}-${place.name}`}>
      {place.slug ? <Link href={`/viajes/${tripSlug}/lugares/${place.slug}`} className="place-link"><span className="place-link-copy"><strong>{place.name}</strong><span>{place.region}</span></span><span aria-hidden="true">↗</span></Link> : <div className="place-link place-link--static"><span className="place-link-copy"><strong>{place.name}</strong><span>{place.region}</span></span></div>}
    </li>)}</ul></div>
    <FullImageBlock media={day.heroImage} />
    {mosaic.length > 0 && <ImageGridBlock items={mosaic} />}
    {day.video && <ShortVideoBlock media={day.video} />}
    {secondaryMedia.length > 0 && <TravelGallery items={secondaryMedia} title={`Galería · ${day.city}`} summary={gallerySummary(secondaryMedia)} label="Ver las fotografías y vídeos de este día" />}
    {(nextDay || closingMedia) && <Link className={`next-day${nextDay ? "" : " next-day--closing"}`} href={nextDay ? `#${nextDay.id}` : "#cierre"}>
      <span className="next-day-media">{transitionMedia && <Image src={transitionMedia.src} alt="" fill unoptimized sizes="8rem" style={{ objectFit: "cover" }} />}</span>
      <span className="next-day-copy"><span>{nextDay ? "Siguiente jornada" : "Cierre del álbum"}</span><strong>{nextDay ? `Día ${nextDay.dayNumber} · ${nextDay.title}` : "Volver a recorrer el viaje"}</strong><small>{nextDay ? `${nextDay.city} · ${nextDay.date}` : "Resumen, álbum completo y regreso al inicio"}</small><b>Continuar <span aria-hidden="true">→</span></b></span>
    </Link>}
  </section>;
}
