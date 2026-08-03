import { TripFacts } from "./TripFacts";
import type { TripFact } from "@/types/travel";
export function TravelIntro({ intro, facts }: { intro: string; facts: TripFact[] }) { return <section className="intro" id="resumen" tabIndex={-1}><span className="section-label">Resumen</span><p>{intro}</p><TripFacts facts={facts} /></section>; }
