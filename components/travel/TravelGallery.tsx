"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { MediaItem } from "@/types/travel";

type FilterKey = string;
type GalleryFilter = { key: FilterKey; label: string };

function matchesFilter(item: MediaItem, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "video") return item.type === "video";
  if (filter === "travel") return item.dayKey === "2018-09-02" || item.dayKey === "2018-09-10" || item.phase?.includes("→") === true;
  return item.city === filter;
}

function MediaTile({ item, index, onOpen }: { item: MediaItem; index: number; onOpen: (index: number) => void }) {
  const label = item.type === "video" ? `Abrir vídeo: ${item.alt}` : `Abrir fotografía: ${item.alt}`;
  if (item.type === "video") {
    return <figure className={`gallery-item gallery-item--video gallery-item--${item.orientation ?? "auto"}`}>
      <button className="gallery-media-trigger gallery-media-trigger--video" type="button" onClick={() => onOpen(index)} aria-label={label}>
        {item.poster ? <Image src={item.poster} alt="" fill loading="lazy" unoptimized sizes="(min-width: 900px) 30vw, 100vw" style={{ objectFit: "cover" }} /> : <span className="gallery-video-placeholder" aria-hidden="true">▶</span>}
        <span className="gallery-play" aria-hidden="true">▶</span>
      </button>
      <figcaption>{item.alt}</figcaption>
    </figure>;
  }

  return <figure className={`gallery-item gallery-item--${item.orientation ?? "auto"}`} style={item.aspectRatio ? { aspectRatio: String(item.aspectRatio) } : undefined}>
    <button className="gallery-media-trigger" type="button" onClick={() => onOpen(index)} aria-label={label}>
      <Image src={item.src} alt={item.alt} fill loading="lazy" unoptimized sizes="(min-width: 900px) 30vw, (min-width: 640px) 33vw, 50vw" style={{ objectFit: item.fit ?? "contain", objectPosition: item.focus ? `${item.focus.x}% ${item.focus.y}%` : "50% 50%" }} />
      <span className="gallery-open-mark" aria-hidden="true">↗</span>
    </button>
  </figure>;
}

function countLabel(items: MediaItem[]) {
  const photos = items.filter((item) => item.type === "image").length;
  const videos = items.filter((item) => item.type === "video").length;
  return `${photos} ${photos === 1 ? "foto" : "fotos"} · ${videos} ${videos === 1 ? "vídeo" : "vídeos"}`;
}

function Lightbox({ items, index, onClose, onChange }: { items: MediaItem[]; index: number; onClose: () => void; onChange: (index: number) => void }) {
  const item = items[index];
  const previous = () => onChange((index - 1 + items.length) % items.length);
  const next = () => onChange((index + 1) % items.length);
  return <div className="lightbox" role="dialog" aria-modal="true" aria-label="Visor de medios">
    <button className="lightbox-close" type="button" onClick={onClose} aria-label="Cerrar visor">×</button>
    <button className="lightbox-control lightbox-control--prev" type="button" onClick={previous} aria-label="Medio anterior">←</button>
    <div className="lightbox-stage">
      {item.type === "video" ? <video controls playsInline muted preload="metadata" poster={item.poster} aria-label={item.alt}><source src={item.src} type="video/mp4" />Tu navegador no puede reproducir este vídeo.</video> : <Image src={item.src} alt={item.alt} fill priority unoptimized sizes="100vw" style={{ objectFit: "contain", objectPosition: item.focus ? `${item.focus.x}% ${item.focus.y}%` : "50% 50%" }} />}
    </div>
    <button className="lightbox-control lightbox-control--next" type="button" onClick={next} aria-label="Medio siguiente">→</button>
    <div className="lightbox-caption"><span>{item.alt}</span><small>{index + 1} / {items.length}</small></div>
  </div>;
}

export function TravelGallery({ items, title = "Galería ampliada", summary, label = "Ver la galería completa", filterOptions }: { items: MediaItem[]; title?: string; summary?: string; label?: string; filterOptions?: GalleryFilter[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const scrollYRef = useRef(0);
  const contentId = useId();
  const filters = filterOptions ?? [];
  const visibleItems = filters.length > 0 ? items.filter((item) => matchesFilter(item, filter)) : items;

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => buttonRef.current?.focus());
  };

  useEffect(() => {
    if (viewerIndex === null) return;
    scrollYRef.current = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewerIndex(null);
      if (event.key === "ArrowLeft") setViewerIndex((current) => current === null ? current : (current - 1 + visibleItems.length) % visibleItems.length);
      if (event.key === "ArrowRight") setViewerIndex((current) => current === null ? current : (current + 1) % visibleItems.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.scrollTo(0, scrollYRef.current);
    };
  }, [viewerIndex, visibleItems.length]);

  const openViewer = (index: number) => {
    scrollYRef.current = window.scrollY;
    setViewerIndex(index);
  };

  return <section className="gallery" aria-labelledby={`${contentId}-title`}>
    <div className="section-heading"><span className="section-label">Fotografías y vídeos</span><h2 id={`${contentId}-title`} className="gallery-title">{title}</h2></div>
    <button ref={buttonRef} className="gallery-toggle" type="button" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen((current) => !current)}>
      <span>{open ? "Ocultar galería" : label}<small>{summary ?? countLabel(items)}</small></span><span className="gallery-toggle-icon" aria-hidden="true">{open ? "−" : "+"}</span>
    </button>
    {open && <div className="gallery-content" id={contentId}>
      {filters.length > 0 && <div className="gallery-filters" role="group" aria-label="Filtrar álbum"><span className="section-label">Filtrar</span><div>{filters.map((option) => <button key={option.key} type="button" className="gallery-filter" aria-pressed={filter === option.key} onClick={() => { setFilter(option.key); setViewerIndex(null); }}>{option.label}</button>)}</div></div>}
      <div className="gallery-grid">{visibleItems.map((item, index) => <MediaTile item={item} index={index} onOpen={openViewer} key={item.id} />)}</div>
      {visibleItems.length === 0 && <p className="gallery-empty">No hay medios en esta selección.</p>}
      <button className="gallery-close" type="button" onClick={close}>Cerrar y volver al día</button>
    </div>}
    {viewerIndex !== null && visibleItems[viewerIndex] && <Lightbox items={visibleItems} index={viewerIndex} onClose={() => setViewerIndex(null)} onChange={setViewerIndex} />}
  </section>;
}
