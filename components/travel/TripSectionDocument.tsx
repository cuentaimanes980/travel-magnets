import { TravelGallery } from "@/components/travel/TravelGallery";
import type { TripSection } from "@/types/travel";

export function TripSectionDocument({ section }: { section: TripSection }) {
  const gallery = section.blocks.find((block) => block.type === "gallery");
  if (!gallery) return null;
  return <section className="travel-additional-section" id={`section-${section.id}`}>
    <div className="section-heading"><span className="section-label">Seccion adicional</span><h2 className="gallery-title">{section.title}</h2></div>
    {section.description && <p className="travel-additional-description">{section.description}</p>}
    <TravelGallery items={gallery.items} title="Galeria completa" summary={`${gallery.items.filter((item) => item.type === "image").length} fotos · ${gallery.items.filter((item) => item.type === "video").length} videos`} label="Ver la galeria completa" />
  </section>;
}
