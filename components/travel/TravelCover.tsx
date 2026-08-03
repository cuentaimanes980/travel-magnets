"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { MediaItem, TripCover } from "@/types/travel";

function CoverImage({ media, priority = false, className = "" }: { media: MediaItem; priority?: boolean; className?: string }) {
  return <Image className={className} src={media.src} alt={media.alt} fill priority={priority} unoptimized sizes="100vw" style={{ objectFit: "cover", objectPosition: media.focus ? `${media.focus.x}% ${media.focus.y}%` : "50% 50%" }} />;
}

function CoverFallback({ media }: { media: MediaItem }) {
  return <div className="cover-fallback"><CoverImage media={media} priority /><span>India · álbum de viaje</span></div>;
}

function VariantCover({ cover }: { cover: TripCover }) {
  const variant = cover.variant ?? "a";
  const media = cover.media.length > 0 ? cover.media : [cover.fallback];

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
  const media = cover.media.length > 0 ? cover.media.slice(0, 5) : [cover.fallback];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (media.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % media.length), 6500);
    return () => window.clearInterval(timer);
  }, [media.length]);

  return <div className="cover-collage" data-active={activeIndex}>{media.map((item, index) => <div className={`cover-cell cover-cell-${index} ${index === activeIndex ? "is-active" : ""}`} key={item.id}><CoverImage media={item} priority={index === 0} /></div>)}</div>;
}

function SlideshowCover({ cover }: { cover: TripCover }) {
  const media = cover.media.length > 0 ? cover.media : [cover.fallback];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (media.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % media.length), 6000);
    return () => window.clearInterval(timer);
  }, [media.length]);

  return <div className="cover-slideshow"><CoverImage media={media[activeIndex]} priority /><span className="cover-count">{String(activeIndex + 1).padStart(2, "0")} / {String(media.length).padStart(2, "0")}</span></div>;
}

function VideoCover({ cover }: { cover: TripCover }) {
  if (!cover.video) return <CoverFallback media={cover.fallback} />;
  return <div className="cover-video"><video autoPlay muted loop playsInline poster={cover.video.poster ?? cover.fallback.src} aria-label="Vídeo de portada"><source src={cover.video.src} type="video/mp4" /></video></div>;
}

export function TravelCover({ title, dates, cover, variantOptions = [], randomize = false }: { title: string; dates: string; cover: TripCover; variantOptions?: TripCover[]; randomize?: boolean }) {
  const [randomCover, setRandomCover] = useState<TripCover>();

  useEffect(() => {
    if (!randomize || variantOptions.length < 2) return;
    const frame = window.requestAnimationFrame(() => {
      const nextIndex = Math.floor(Math.random() * variantOptions.length);
      setRandomCover(variantOptions[nextIndex]);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [randomize, variantOptions]);

  const selectedCover = randomize ? randomCover ?? cover : cover;

  return <section className="travel-cover" data-cover-variant={selectedCover.variant ?? "legacy"} aria-label={`Portada del álbum ${title}`}>
    <div className="cover-media">{selectedCover.variant && <VariantCover cover={selectedCover} />}{!selectedCover.variant && selectedCover.mode === "collage" && <CollageCover cover={selectedCover} />}{!selectedCover.variant && selectedCover.mode === "slideshow" && <SlideshowCover cover={selectedCover} />}{!selectedCover.variant && selectedCover.mode === "video" && <VideoCover cover={selectedCover} />}</div>
    <div className="cover-shade" />
    <div className="cover-copy"><h1>{title}</h1><p>{dates}</p></div>
    <a className="cover-scroll" href="#resumen">Continuar <span aria-hidden="true">↓</span></a>
  </section>;
}
