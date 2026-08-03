import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlacePageDocument } from "@/components/travel/PlacePageDocument";
import { getPlacePage } from "@/lib/travel-data";

type Props = { params: Promise<{ slug: string; placeSlug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, placeSlug } = await params;
  const page = await getPlacePage(placeSlug, slug);
  return page ? { title: `${page.place.name} · ${page.trip.title}`, description: page.place.shortSummary } : { title: "Lugar no encontrado" };
}

export default async function GenericPlacePage({ params }: Props) {
  const { slug, placeSlug } = await params;
  const page = await getPlacePage(placeSlug, slug);
  if (!page) notFound();
  return <PlacePageDocument page={page} />;
}
