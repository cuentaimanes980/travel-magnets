"use client";

import { useEffect, useState } from "react";
import type { TripDay } from "@/types/travel";

export function TravelProgress({ days }: { days: TripDay[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const elements = days.map((day) => document.getElementById(day.id)).filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (!visible) return;
      const nextIndex = elements.indexOf(visible.target as HTMLElement);
      if (nextIndex >= 0) {
        setActiveIndex(nextIndex);
        setStarted(true);
      }
    }, { rootMargin: "-18% 0px -55%", threshold: [0.1, 0.35, 0.65] });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [days]);

  const day = days[activeIndex] ?? days[0];
  if (!day || !started) return null;
  const progress = Math.round(((activeIndex + 1) / days.length) * 100);
  return <div className="travel-progress" aria-live="polite" aria-label={`Jornada ${activeIndex + 1} de ${days.length}`}>
    <div className="travel-progress-copy"><span>Recorrido</span><strong>Día {day.dayNumber} de {days.length} · {day.title}</strong><small>{day.city}</small></div>
    <div className="travel-progress-meter" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
  </div>;
}
