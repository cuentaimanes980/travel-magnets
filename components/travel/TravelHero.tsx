import Image from "next/image";
import type { MediaItem } from "@/types/travel";
export function TravelHero({ title, dates, media }: { title: string; dates: string; media: MediaItem }) { return <section className="hero"><Image className="hero-image" src={media.src} alt={media.alt} fill priority sizes="100vw" /><div className="hero-copy"><p className="hero-kicker">Travel Magnets / 001</p><h1>{title}</h1><p className="hero-subtitle">{dates}</p></div><span className="scroll-cue">Desliza</span></section>; }
