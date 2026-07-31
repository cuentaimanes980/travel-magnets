import { indiaTrip } from "../data/india";
import { getSupabaseTripBySlug } from "../lib/travel-data/supabase";
import type { Trip } from "../types/travel";

function differences(local: Trip, remote: Trip | undefined) {
  const result: string[] = [];
  if (!remote) return ["trip: no existe una version publicada en Supabase"];
  if (local.title !== remote.title) result.push("trip.title");
  if (local.dates !== remote.dates) result.push("trip.dates");
  if (local.intro !== remote.intro) result.push("trip.intro");
  if (local.days.length !== remote.days.length) result.push("days.length");
  local.days.forEach((day, index) => {
    const candidate = remote.days[index];
    if (!candidate || day.date !== candidate.date || day.title !== candidate.title || day.dayNumber !== candidate.dayNumber) result.push(`days[${index}]`);
  });
  if (local.route.map((place) => place.name).join("|") !== remote.route.map((place) => place.name).join("|")) result.push("route");
  if (local.gallery.length !== remote.gallery.length) result.push("gallery.length");
  local.gallery.forEach((item, index) => {
    const candidate = remote.gallery[index];
    if (!candidate || item.type !== candidate.type || item.alt !== candidate.alt || item.src !== candidate.src) result.push(`gallery[${index}]`);
  });
  (["a", "b", "c", "d"] as const).forEach((variant) => {
    const localCover = local.coverVariants?.[variant];
    const remoteCover = remote.coverVariants?.[variant];
    if (!localCover || !remoteCover || localCover.media.map((item) => item.src).join("|") !== remoteCover.media.map((item) => item.src).join("|") || localCover.video?.src !== remoteCover.video?.src) result.push(`cover.${variant}`);
  });
  return result;
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.log("REMOTE_COMPARE=SKIPPED");
    console.log("Motivo: no hay credenciales publicables de Supabase configuradas.");
    return;
  }
  const remote = await getSupabaseTripBySlug("india");
  const result = differences(indiaTrip, remote);
  console.log(`DIFFERENCES=${result.length}`);
  result.forEach((item) => console.log(`DIFF=${item}`));
  console.log(`REMOTE_COMPARE=${result.length === 0 ? "OK" : "DIFFERENCES"}`);
  if (result.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "La comparacion ha fallado.");
  process.exitCode = 1;
});
