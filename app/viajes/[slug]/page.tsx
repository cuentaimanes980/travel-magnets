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
import { getIndiaCoverVariant, indiaCoverVariants, indiaTrip } from "@/data/india";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ portada?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug !== indiaTrip.slug) return { title: "Viaje no encontrado" };
  return { title: indiaTrip.title, description: indiaTrip.intro, openGraph: { title: `${indiaTrip.title} | Travel Magnets`, description: indiaTrip.intro } };
}

export default async function TripPage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (slug !== indiaTrip.slug) notFound();
  const query = await searchParams;
  const portada = Array.isArray(query.portada) ? query.portada[0] : query.portada;
  return <main className="travel-page" id="top"><TravelCover title={indiaTrip.title} dates={indiaTrip.dates} cover={getIndiaCoverVariant(portada)} variantOptions={Object.values(indiaCoverVariants)} randomize={!portada} /><article className="story"><div className="album-bar"><Link href="/">Travel Magnets</Link><div className="album-actions"><a href="#resumen">Resumen</a><TripIndexNav days={indiaTrip.days} /></div></div><TravelIntro intro={indiaTrip.intro} facts={indiaTrip.facts} /><TripRouteSummary places={indiaTrip.route} />{indiaTrip.days.map((day, index) => <DaySection day={day} nextDay={indiaTrip.days[index + 1]} key={day.id} />)}<div id="album-completo"><TravelGallery items={indiaTrip.gallery} title="Álbum completo" summary="40 fotos · 6 vídeos" label="Ver el álbum completo" filterOptions={[{ key: "all", label: "Todo" }, { key: "Delhi", label: "Delhi" }, { key: "Jaipur", label: "Jaipur" }, { key: "Agra", label: "Agra" }, { key: "travel", label: "Traslados" }, { key: "video", label: "Vídeos" }]} /></div><TravelClosing closing={indiaTrip.closing} /></article></main>;
}
