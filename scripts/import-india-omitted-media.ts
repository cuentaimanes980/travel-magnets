import { createHash } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import manifestJson from "../data/india-media-manifest.json";
import { createSupabaseAdminClient } from "../lib/supabase/client";
import type { IndiaMediaManifest } from "../types/travel";

loadEnvConfig(process.cwd());

const manifest = manifestJson as IndiaMediaManifest;
const tripSlug = "india";

function hash(localId: string) {
  return createHash("sha256").update(`travel-magnets:${localId}`).digest("hex");
}

function pendingKey(sourceHash: string, type: string) {
  return `pending/india/${sourceHash}/${type}`;
}

function row(record: IndiaMediaManifest["files"][number], tripId: string) {
  const sourcePathHash = hash(record.id);
  return {
    trip_id: tripId,
    source_path_hash: sourcePathHash,
    storage_key: pendingKey(sourcePathHash, record.type === "video" ? "video" : "image"),
    thumbnail_key: null,
    poster_key: null,
    media_type: record.type,
    width: record.width ?? null,
    height: record.height ?? null,
    aspect_ratio: record.aspectRatio ?? null,
    orientation: record.orientation ?? null,
    alt: record.alt,
    focus: record.focus ?? {},
    capture_date: record.captureDate ?? null,
    capture_time: record.captureTime ?? null,
    review_status: "pending",
    exclusion_reason: record.omissionReason ?? "Pendiente de revision editorial.",
    metadata: {
      local_id: record.id,
      original_file_name: record.originalFileName,
      description: record.notes,
      city: record.city,
      day_key: record.dayKey,
      phase: record.phase,
      source_folder: record.folderSource,
      candidate_places: record.placeCandidates,
      duration_seconds: record.durationSeconds ?? null,
    },
  };
}

async function main() {
  const omitted = manifest.files.filter((record) => !record.imported);
  const mode = process.argv.includes("--dry-run") ? "dry-run" : "import";
  console.log(`OMITTED_MODE=${mode}`);
  console.log(`OMITTED_CANDIDATES=${omitted.length}`);
  console.log("R2_UPLOADS=0");
  if (mode === "dry-run") return;
  const client = createSupabaseAdminClient();
  const trip = await client.from("trips").select("id").eq("slug", tripSlug).single();
  if (trip.error) throw new Error(trip.error.message);
  const rows = omitted.map((record) => row(record, String(trip.data.id)));
  const existing = await client.from("media").select("source_path_hash, review_status").eq("trip_id", trip.data.id).in("source_path_hash", rows.map((item) => item.source_path_hash));
  if (existing.error) throw new Error(existing.error.message);
  const existingHashes = new Set((existing.data ?? []).map((item) => item.source_path_hash));
  console.log(`ALREADY_REGISTERED=${rows.filter((item) => existingHashes.has(item.source_path_hash)).length}`);
  const result = await client.from("media").upsert(rows, { onConflict: "trip_id,source_path_hash" });
  if (result.error) throw new Error(result.error.message);
  console.log(`IMPORTED_PENDING=${rows.length}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
