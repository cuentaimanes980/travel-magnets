import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DaySection } from "@/components/travel/DaySection";
import { TravelClosing } from "@/components/travel/TravelClosing";
import { TravelCover } from "@/components/travel/TravelCover";
import { TravelGallery } from "@/components/travel/TravelGallery";
import { TravelIntro } from "@/components/travel/TravelIntro";
import { TripRouteSummary } from "@/components/travel/TripRouteSummary";
import { TripIndexNav } from "@/components/travel/TripIndexNav";
import { getConfiguredDataSource, getCoverVariant, getTripBySlug } from "@/lib/travel-data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ portada?: string | string[] }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) return { title: "Viaje no encontrado" };
  return { title: trip.title, description: trip.intro, openGraph: { title: `${trip.title} | Travel Magnets`, description: trip.intro } };
}

export default async function TripPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();
  const query = await searchParams;
  const portada = Array.isArray(query.portada) ? query.portada[0] : query.portada;
  const coverVariants = trip.coverVariants ? Object.values(trip.coverVariants) : [trip.cover];
  return <main className="travel-page" id="top" data-data-source={getConfiguredDataSource()}><TravelCover title={trip.title} dates={trip.dates} cover={getCoverVariant(trip, portada)} variantOptions={coverVariants} randomize={!portada} /><article className="story"><div className="album-bar"><Link href="/">Travel Magnets</Link><div className="album-actions"><a href="#resumen">Resumen</a><TripIndexNav days={trip.days} /></div></div><TravelIntro intro={trip.intro} facts={trip.facts} /><TripRouteSummary places={trip.route} />{trip.days.map((day, index) => <DaySection day={day} nextDay={trip.days[index + 1]} key={day.id} />)}<div id="album-completo"><TravelGallery items={trip.gallery} title="Álbum completo" summary="40 fotos · 6 vídeos" label="Ver el álbum completo" filterOptions={[{ key: "all", label: "Todo" }, { key: "Delhi", label: "Delhi" }, { key: "Jaipur", label: "Jaipur" }, { key: "Agra", label: "Agra" }, { key: "travel", label: "Traslados" }, { key: "video", label: "Vídeos" }]} /></div><TravelClosing closing={trip.closing} /></article></main>;
}
