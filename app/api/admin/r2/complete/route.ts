import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { allowedUpload, fileNameMatchesType, headR2Object, mediaTypeFor } from "@/lib/r2/server";

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function object(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }

export async function POST(request: Request) {
  const context = await requireAdminApi();
  if (!context?.user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const tripSlug = text(body.tripSlug);
    const key = text(body.storageKey);
    const contentType = text(body.contentType);
    if (!tripSlug || !key.startsWith(`trips/${tripSlug}/`) || !/^trips\/[a-z0-9-]+\/(images\/full|videos)\//.test(key)) return NextResponse.json({ error: "Clave de almacenamiento no valida." }, { status: 400 });
    if (!mediaTypeFor(contentType) || !fileNameMatchesType(text(body.storageFileName), contentType) || typeof body.size !== "number" || !allowedUpload(contentType, "full", body.size)) return NextResponse.json({ error: "El tipo o tamano del medio no esta permitido." }, { status: 400 });
    const trip = await context.client.from("trips").select("id").eq("slug", tripSlug).maybeSingle();
    if (trip.error) return NextResponse.json({ error: trip.error.message }, { status: 400 });
    if (!trip.data) return NextResponse.json({ error: "Viaje no encontrado." }, { status: 404 });
    const remote = await headR2Object(key);
    if (remote.ContentType !== contentType) return NextResponse.json({ error: "El Content-Type remoto no coincide." }, { status: 400 });
    if (typeof body.size === "number" && remote.ContentLength !== body.size) return NextResponse.json({ error: "El tamano remoto no coincide." }, { status: 400 });
    const thumbnailKey = text(body.thumbnailKey);
    const posterKey = text(body.posterKey);
    for (const derivative of [thumbnailKey, posterKey].filter(Boolean)) {
      if (!derivative.startsWith(`trips/${tripSlug}/`) || !/^trips\/[a-z0-9-]+\/(images\/thumbs|posters)\//.test(derivative)) return NextResponse.json({ error: "Clave de derivado no valida." }, { status: 400 });
      await headR2Object(derivative);
    }
    const sourcePathHash = text(body.sourcePathHash) || null;
    if (sourcePathHash) {
      const existing = await context.client.from("media").select("id").eq("trip_id", trip.data.id).eq("source_path_hash", sourcePathHash).maybeSingle();
      if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 400 });
      if (existing.data) return NextResponse.json({ mediaId: existing.data.id, duplicate: true });
    }
    const metadata = object(body.metadata);
    const insert = await context.client.from("media").insert({
      trip_id: trip.data.id,
      storage_key: key,
      thumbnail_key: thumbnailKey || null,
      poster_key: posterKey || null,
      media_type: body.mediaType === "video" ? "video" : "image",
      width: number(body.width),
      height: number(body.height),
      aspect_ratio: number(body.aspectRatio),
      orientation: ["landscape", "portrait", "square"].includes(text(body.orientation)) ? text(body.orientation) : null,
      alt: text(body.alt) || text(metadata.originalFileName) || "Medio del viaje",
      focus: { x: number(body.focusX) ?? 50, y: number(body.focusY) ?? 50 },
      capture_date: text(body.captureDate) || null,
      capture_time: text(body.captureTime) || null,
      review_status: "pending",
      source_path_hash: sourcePathHash,
      metadata: { ...metadata, original_file_name: text(body.originalFileName), content_type: contentType, duration_seconds: number(body.durationSeconds) },
    }).select("id").single();
    if (insert.error) return NextResponse.json({ error: insert.error.message }, { status: 400 });
    return NextResponse.json({ mediaId: insert.data.id, duplicate: false });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo registrar el medio." }, { status: 400 });
  }
}
