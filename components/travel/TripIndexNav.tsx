import type { TripDay } from "@/types/travel";

const cityLinks = [
  { label: "Delhi", target: "day-01" },
  { label: "Jaipur", target: "day-03" },
  { label: "Agra", target: "day-06" },
];

export function TripIndexNav({ days }: { days: TripDay[] }) {
  return <details className="trip-index">
    <summary>Índice del viaje</summary>
    <div className="trip-index-panel">
      <div className="trip-index-cities">{cityLinks.map((city) => <a href={`#${city.target}`} key={city.target}>{city.label}</a>)}</div>
      <ol>{days.map((day) => <li key={day.id}><a href={`#${day.id}`}><span>Día {day.dayNumber}</span><strong>{day.title}</strong><small>{day.date}</small></a></li>)}</ol>
    </div>
  </details>;
}
