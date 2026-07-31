import { createSupabaseAdminClient } from "../lib/supabase/client";
import { buildIndiaSeed, indiaSeedSummary } from "../lib/supabase/india-seed";

const expected = indiaSeedSummary(buildIndiaSeed());

async function count(table: string, column: string, value: string) {
  const client = createSupabaseAdminClient();
  const result = await client.from(table).select("id", { count: "exact", head: true }).eq(column, value);
  if (result.error) throw new Error(`No se pudo verificar ${table}: ${result.error.message}`);
  return result.count ?? 0;
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.log("REMOTE_VERIFY=SKIPPED");
    console.log("Motivo: no hay credenciales de Supabase configuradas.");
    console.log(`Expected ${JSON.stringify(expected)}`);
    return;
  }

  const tripId = buildIndiaSeed().trips[0].id as string;
  const actual = {
    trips: await count("trips", "id", tripId),
    days: await count("trip_days", "trip_id", tripId),
    places: await count("places", "trip_id", tripId),
    media: await count("media", "trip_id", tripId),
    mediaAssignments: await count("media_assignments", "trip_id", tripId),
    heroSets: await count("hero_sets", "trip_id", tripId),
    nfcLinks: await count("nfc_links", "trip_id", tripId),
  };
  const client = createSupabaseAdminClient();
  const mediaIds = await client.from("media").select("media_type").eq("trip_id", tripId);
  if (mediaIds.error) throw new Error(`No se pudo verificar los medios: ${mediaIds.error.message}`);
  const heroSets = await client.from("hero_sets").select("id").eq("trip_id", tripId);
  if (heroSets.error) throw new Error(`No se pudieron verificar las portadas: ${heroSets.error.message}`);
  const heroSetIds = heroSets.data?.map((row) => row.id) ?? [];
  const heroSetMedia = heroSetIds.length > 0 ? await client.from("hero_set_media").select("hero_set_id").in("hero_set_id", heroSetIds) : { data: [], error: null };
  if (heroSetMedia.error) throw new Error(`No se pudieron verificar los medios de portada: ${heroSetMedia.error.message}`);
  const dayRows = await client.from("trip_days").select("id").eq("trip_id", tripId);
  if (dayRows.error) throw new Error(`No se pudieron verificar las jornadas: ${dayRows.error.message}`);
  const dayIds = dayRows.data?.map((row) => row.id) ?? [];
  const dayPlaceRelations = dayIds.length > 0 ? await client.from("trip_day_places").select("trip_day_id").in("trip_day_id", dayIds) : { data: [], error: null };
  if (dayPlaceRelations.error) throw new Error(`No se pudieron verificar las relaciones de lugares: ${dayPlaceRelations.error.message}`);
  const result = {
    ...actual,
    dayPlaceRelations: dayPlaceRelations.data?.length ?? 0,
    photos: mediaIds.data?.filter((row) => row.media_type === "image").length ?? 0,
    videos: mediaIds.data?.filter((row) => row.media_type === "video").length ?? 0,
    heroSetMedia: heroSetMedia.data?.length ?? 0,
  };
  console.log(`Expected ${JSON.stringify(expected)}`);
  console.log(`Actual ${JSON.stringify(result)}`);
  const ok = result.trips === expected.trips && result.days === expected.days && result.places === expected.places && result.dayPlaceRelations === expected.dayPlaceRelations && result.media === expected.photos + expected.videos && result.photos === expected.photos && result.videos === expected.videos && result.mediaAssignments === expected.mediaAssignments && result.heroSets === expected.heroSets && result.heroSetMedia === expected.heroSetMedia && result.nfcLinks === expected.nfcLinks;
  console.log(`REMOTE_VERIFY=${ok ? "OK" : "DIFFERENCES"}`);
  if (!ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "La verificacion ha fallado.");
  process.exitCode = 1;
});
