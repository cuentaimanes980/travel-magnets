import { TravelGallery } from "@/components/travel/TravelGallery";
import type { TripSection } from "@/types/travel";

export function TripSectionDocument({ section }: { section: TripSection }) {
  const gallery = section.blocks.find((block) => block.type === "gallery");
  if (!gallery) return null;
  const photos = gallery.items.filter((item) => item.type === "image").length;
  const videos = gallery.items.filter((item) => item.type === "video").length;
  return <section className="travel-additional-section" id={`section-${section.id}`}>
    {section.description && <p className="travel-additional-description"><span className="section-label">Sección editorial</span>{section.description}</p>}
    <TravelGallery items={gallery.items} title={section.title} summary={`Ver ${photos} ${photos === 1 ? "foto" : "fotos"} · ${videos} ${videos === 1 ? "vídeo" : "vídeos"}`} label={`Ver la galería de ${section.title}`} />
  </section>;
}
