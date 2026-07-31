import { buildIndiaSeed, indiaSeedSummary } from "../lib/supabase/india-seed";
import { createSupabaseAdminClient } from "../lib/supabase/client";

const seed = buildIndiaSeed();
const summary = indiaSeedSummary(seed);
const dryRun = process.argv.includes("--dry-run");

function printSummary(label: string) {
  console.log(`INDIA_SEED=${label}`);
  Object.entries(summary).forEach(([key, value]) => console.log(`${key}=${value}`));
  console.log("deletes=0");
}

async function writeTable(table: string, rows: Record<string, unknown>[], onConflict: string) {
  if (rows.length === 0) return;
  const client = createSupabaseAdminClient();
  for (let index = 0; index < rows.length; index += 100) {
    const chunk = rows.slice(index, index + 100);
    const result = await client.from(table).upsert(chunk, { onConflict });
    if (result.error) throw new Error(`No se pudo importar ${table}: ${result.error.message}`);
  }
  console.log(`upserted.${table}=${rows.length}`);
}

async function main() {
  if (dryRun) {
    printSummary("DRY_RUN");
    console.log("No se ha contactado con Supabase y no se han modificado medios.");
    return;
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY; el importador no se ejecuta.");
    process.exitCode = 1;
    return;
  }

  printSummary("IMPORT");
  await writeTable("trips", seed.trips, "id");
  await writeTable("trip_days", seed.trip_days, "id");
  await writeTable("places", seed.places, "id");
  await writeTable("trip_day_places", seed.trip_day_places, "trip_day_id,place_id");
  await writeTable("media", seed.media, "id");
  await writeTable("media_assignments", seed.media_assignments, "id");
  await writeTable("hero_sets", seed.hero_sets, "id");
  await writeTable("hero_set_media", seed.hero_set_media, "hero_set_id,media_id");
  await writeTable("nfc_links", seed.nfc_links, "id");
  console.log("IMPORT_STATUS=OK");
  console.log("No se han eliminado filas ni modificado medios.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "La importacion ha fallado.");
  process.exitCode = 1;
});
