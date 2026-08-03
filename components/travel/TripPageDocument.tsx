import Link from "next/link";
import { DaySection } from "@/components/travel/DaySection";
import { TravelClosing } from "@/components/travel/TravelClosing";
import { TravelCover } from "@/components/travel/TravelCover";
import { TravelGallery } from "@/components/travel/TravelGallery";
import { TravelIntro } from "@/components/travel/TravelIntro";
import { TravelProgress } from "@/components/travel/TravelProgress";
import { TripIndexNav } from "@/components/travel/TripIndexNav";
import { TripRouteSummary } from "@/components/travel/TripRouteSummary";
import { TripSectionDocument } from "@/components/travel/TripSectionDocument";
import { getConfiguredDataSource, getCoverVariant } from "@/lib/travel-data";
import type { Trip, TripSection } from "@/types/travel";

function sectionsAfterDay(sections: TripSection[], dayNumber: number) {
  return sections.filter((section) => section.afterDayNumber === dayNumber);
}

export function TripPageDocument({ trip, portada, preview = false }: { trip: Trip; portada?: string; preview?: boolean }) {
  const cities = Array.from(new Set(trip.gallery.map((item) => item.city).filter((city): city is string => Boolean(city))));
  const hasTravelMedia = trip.gallery.some((item) => item.dayKey === "2018-09-02" || item.dayKey === "2018-09-10" || item.phase?.includes("→"));
  const filterOptions = [{ key: "all", label: "Todo" }, ...cities.map((city) => ({ key: city, label: city })), ...(hasTravelMedia ? [{ key: "travel", label: "Traslados" }] : []), ...(trip.gallery.some((item) => item.type === "video") ? [{ key: "video", label: "Vídeos" }] : [])];
  const sections = trip.sections ?? [];
  const trailingSections = sections.filter((section) => section.afterDayNumber === undefined);
  return <main className="travel-page" id="top" data-data-source={getConfiguredDataSource()} data-preview={preview ? "true" : undefined}>
    {preview && <div className="preview-banner">Vista previa privada del borrador</div>}
    <TravelCover title={trip.title} dates={trip.dates} cover={getCoverVariant(trip, portada)} />
    <article className="story">
      <div className="album-bar"><Link href={preview ? `/admin/viajes/${trip.slug}` : "/"}>Travel Magnets</Link><div className="album-actions"><a href="#resumen">Resumen</a><a href="#indice">Índice</a></div></div>
      <TripIndexNav days={trip.days} sections={sections} />
      <TravelIntro intro={trip.intro} facts={trip.facts} />
      <TripRouteSummary places={trip.route} />
      <TravelProgress days={trip.days} />
      {trip.days.map((day, index) => <div key={day.id}><DaySection day={day} nextDay={trip.days[index + 1]} closingMedia={index === trip.days.length - 1 ? trip.closing.media : undefined} tripSlug={trip.slug} />{sectionsAfterDay(sections, day.dayNumber).map((section) => <TripSectionDocument section={section} key={section.id} />)}</div>)}
      <div id="album-completo"><TravelGallery items={trip.gallery} title="Álbum completo" summary={`Ver ${trip.gallery.filter((item) => item.type === "image").length} fotos · ${trip.gallery.filter((item) => item.type === "video").length} vídeos`} label="Ver el álbum completo" filterOptions={filterOptions} /></div>
      {trailingSections.map((section) => <TripSectionDocument section={section} key={section.id} />)}
      <TravelClosing closing={trip.closing} />
    </article>
  </main>;
}
