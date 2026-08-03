"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { MediaItem, TripCover } from "@/types/travel";
import { dedupeMedia } from "@/lib/travel-data/media-selection";

function CoverImage({ media, priority = false, className = "" }: { media: MediaItem; priority?: boolean; className?: string }) {
  return <Image className={className} src={media.src} alt={media.alt} fill priority={priority} unoptimized sizes="100vw" style={{ objectFit: "cover", objectPosition: media.focus ? `${media.focus.x}% ${media.focus.y}%` : "50% 50%" }} />;
}

function CoverFallback({ media, title }: { media: MediaItem; title: string }) {
  return <div className="cover-fallback"><CoverImage media={media} priority /><span>{title} · álbum de viaje</span></div>;
}

function VariantCover({ cover }: { cover: TripCover }) {
  const variant = cover.variant ?? "a";
  const media = dedupeMedia(cover.media).length > 0 ? dedupeMedia(cover.media) : [cover.fallback];

  if (variant === "d" && cover.video) {
    return <div className="cover-variant cover-variant--d">
      <div className="cover-variant-video"><video autoPlay muted loop playsInline poster={cover.video.poster ?? media[0]?.src ?? cover.fallback.src} aria-label="Vídeo corto de portada"><source src={cover.video.src} type="video/mp4" /></video></div>
      {media.slice(0, 2).map((item, index) => <div className={`cover-variant-cell cover-variant-cell-${index + 1}`} key={item.id}><CoverImage media={item} priority={index === 0} /></div>)}
    </div>;
  }

  const count = variant === "c" ? 4 : 3;
  return <div className={`cover-variant cover-variant--${variant}`}>
    {media.slice(0, count).map((item, index) => <div className={`cover-variant-cell cover-variant-cell-${index}`} key={item.id}><CoverImage media={item} priority={index === 0} /></div>)}
  </div>;
}

function CollageCover({ cover }: { cover: TripCover }) {
  const uniqueMedia = dedupeMedia(cover.media);
  const media = uniqueMedia.length > 0 ? uniqueMedia.slice(0, 5) : [cover.fallback];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (media.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % media.length), 6500);
    return () => window.clearInterval(timer);
  }, [media.length]);

  return <div className="cover-collage" data-active={activeIndex}>{media.map((item, index) => <div className={`cover-cell cover-cell-${index} ${index === activeIndex ? "is-active" : ""}`} key={item.id}><CoverImage media={item} priority={index === 0} /></div>)}</div>;
}

function SlideshowCover({ cover }: { cover: TripCover }) {
  const uniqueMedia = dedupeMedia(cover.media);
  const media = uniqueMedia.length > 0 ? uniqueMedia : [cover.fallback];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (media.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % media.length), 6000);
    return () => window.clearInterval(timer);
  }, [media.length]);

  return <div className="cover-slideshow"><CoverImage media={media[activeIndex]} priority /><span className="cover-count">{String(activeIndex + 1).padStart(2, "0")} / {String(media.length).padStart(2, "0")}</span></div>;
}

function VideoCover({ cover, title }: { cover: TripCover; title: string }) {
  if (!cover.video) return <CoverFallback media={cover.fallback} title={title} />;
  return <div className="cover-video"><video autoPlay muted loop playsInline poster={cover.video.poster ?? cover.fallback.src} aria-label="Vídeo de portada"><source src={cover.video.src} type="video/mp4" /></video></div>;
}

export function TravelCover({ title, dates, cover }: { title: string; dates: string; cover: TripCover }) {
  const selectedCover = cover;

  return <section className="travel-cover" data-cover-variant={selectedCover.variant ?? "legacy"} aria-label={`Portada del álbum ${title}`}>
    <div className="cover-media">{selectedCover.variant && <VariantCover cover={selectedCover} />}{!selectedCover.variant && selectedCover.mode === "collage" && <CollageCover cover={selectedCover} />}{!selectedCover.variant && selectedCover.mode === "slideshow" && <SlideshowCover cover={selectedCover} />}{!selectedCover.variant && selectedCover.mode === "video" && <VideoCover cover={selectedCover} title={title} />}</div>
    <div className="cover-shade" />
    <div className="cover-copy"><h1>{title}</h1><p>{dates}</p></div>
    <a className="cover-scroll cover-start" href="#resumen" onClick={(event) => {
      const target = document.getElementById("resumen");
      if (!target) return;
      event.preventDefault();
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      window.history.replaceState(null, "", "#resumen");
    }}>Empezar el viaje <span aria-hidden="true">↓</span></a>
  </section>;
}
