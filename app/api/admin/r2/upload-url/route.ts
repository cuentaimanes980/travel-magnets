import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { allowedUpload, createUploadUrl, fileNameMatchesType, mediaKey, mediaTypeFor, type UploadRole } from "@/lib/r2/server";

const recentRequests = new Map<string, number>();

export async function POST(request: Request) {
  const context = await requireAdminApi();
  if (!context?.user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const now = Date.now();
  const previous = recentRequests.get(context.user.id) ?? 0;
  if (now - previous < 250) return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  recentRequests.set(context.user.id, now);

  try {
    const body = await request.json() as Record<string, unknown>;
    const tripSlug = typeof body.tripSlug === "string" ? body.tripSlug.trim() : "";
    const fileName = typeof body.fileName === "string" ? body.fileName : "";
    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    const size = typeof body.size === "number" ? body.size : 0;
    const role = body.role === "thumbnail" || body.role === "poster" ? body.role : "full" as UploadRole;
    const mediaType = mediaTypeFor(contentType);
    if (!tripSlug || !fileName || !mediaType || !fileNameMatchesType(fileName, contentType) || !allowedUpload(contentType, role, size)) return NextResponse.json({ error: "Archivo no permitido por tipo o tamano." }, { status: 400 });
    const trip = await context.client.from("trips").select("id").eq("slug", tripSlug).maybeSingle();
    if (trip.error) return NextResponse.json({ error: trip.error.message }, { status: 400 });
    if (!trip.data) return NextResponse.json({ error: "Viaje no encontrado." }, { status: 404 });
    const { key, id } = mediaKey(tripSlug, role, fileName);
    const uploadUrl = await createUploadUrl(key, contentType);
    return NextResponse.json({ uploadUrl, key, assetId: id, mediaType, expiresIn: 300 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo preparar la subida." }, { status: 400 });
  }
}
