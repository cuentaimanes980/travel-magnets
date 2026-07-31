import type { TripFact } from "@/types/travel";
export function TripFacts({ facts }: { facts: TripFact[] }) { return <div className="facts">{facts.map((fact) => <div className="fact" key={fact.label}><span className="fact-label">{fact.label}</span><span className="fact-value">{fact.value}</span></div>)}</div>; }
