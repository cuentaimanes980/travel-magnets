import Link from "next/link";
import { DaySection } from "@/components/travel/DaySection";
import { TravelClosing } from "@/components/travel/TravelClosing";
import { TravelCover } from "@/components/travel/TravelCover";
import { TravelGallery } from "@/components/travel/TravelGallery";
import { TravelIntro } from "@/components/travel/TravelIntro";
import { TripRouteSummary } from "@/components/travel/TripRouteSummary";
import { TripIndexNav } from "@/components/travel/TripIndexNav";
import { getConfiguredDataSource, getCoverVariant } from "@/lib/travel-data";
import type { Trip } from "@/types/travel";

export function TripPageDocument({ trip, portada, preview = false }: { trip: Trip; portada?: string; preview?: boolean }) {
  const coverVariants = trip.coverVariants ? Object.values(trip.coverVariants) : [trip.cover];
  const cities = Array.from(new Set(trip.gallery.map((item) => item.city).filter((city): city is string => Boolean(city))));
  const hasTravelMedia = trip.gallery.some((item) => item.dayKey === "2018-09-02" || item.dayKey === "2018-09-10" || item.phase?.includes("→"));
  const filterOptions = [{ key: "all", label: "Todo" }, ...cities.map((city) => ({ key: city, label: city })), ...(hasTravelMedia ? [{ key: "travel", label: "Traslados" }] : []), ...(trip.gallery.some((item) => item.type === "video") ? [{ key: "video", label: "Videos" }] : [])];
  return <main className="travel-page" id="top" data-data-source={getConfiguredDataSource()} data-preview={preview ? "true" : undefined}>
    {preview && <div className="preview-banner">Vista previa privada del borrador</div>}
    <TravelCover title={trip.title} dates={trip.dates} cover={getCoverVariant(trip, portada)} variantOptions={coverVariants} randomize={!portada && !preview} />
    <article className="story">
      <div className="album-bar"><Link href={preview ? `/admin/viajes/${trip.slug}` : "/"}>Travel Magnets</Link><div className="album-actions"><a href="#resumen">Resumen</a><TripIndexNav days={trip.days} /></div></div>
      <TravelIntro intro={trip.intro} facts={trip.facts} />
      <TripRouteSummary places={trip.route} />
      {trip.days.map((day, index) => <DaySection day={day} nextDay={trip.days[index + 1]} key={day.id} />)}
      <div id="album-completo"><TravelGallery items={trip.gallery} title="Album completo" summary={`${trip.gallery.filter((item) => item.type === "image").length} fotos · ${trip.gallery.filter((item) => item.type === "video").length} videos`} label="Ver el album completo" filterOptions={filterOptions} /></div>
      <TravelClosing closing={trip.closing} />
    </article>
  </main>;
}
