import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TripPageDocument } from "@/components/travel/TripPageDocument";
import { getTripBySlug } from "@/lib/travel-data";

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
  return <TripPageDocument trip={trip} portada={portada} />;
}
