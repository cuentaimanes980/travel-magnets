import Image from "next/image";
import Link from "next/link";
import type { ContentBlock } from "@/types/travel";
type Closing = Extract<ContentBlock, { type: "closing" }>;
export function TravelClosing({ closing }: { closing: Closing }) { return <section className="closing" id="cierre"><Image src={closing.media.src} alt={closing.media.alt} fill loading="lazy" unoptimized={closing.media.src.startsWith("/demo/india/real/")} sizes="100vw" style={{ objectFit: closing.media.fit ?? "cover", objectPosition: closing.media.focus ? `${closing.media.focus.x}% ${closing.media.focus.y}%` : "50% 50%" }} /><div className="closing-copy"><span className="section-label">Cierre</span><h2>{closing.title}</h2><p>{closing.body}</p><div className="closing-actions"><Link href="/">Volver al inicio</Link><Link href="#album-completo">Abrir el álbum completo</Link></div></div></section>; }
