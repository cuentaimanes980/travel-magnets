"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";

const mediaRoles = new Set(["day_hero", "day_mosaic", "day_gallery", "day_video", "place", "place_cover", "closing"]);

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function integer(formData: FormData, name: string, fallback = 0) {
  const value = Number.parseInt(text(formData, name), 10);
  return Number.isFinite(value) ? value : fallback;
}

function decimal(formData: FormData, name: string, fallback = 50) {
  const value = Number.parseFloat(text(formData, name));
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
}

function jsonObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function refreshPublic(tripSlug: string) {
  revalidatePath(`/viajes/${tripSlug}`);
  revalidatePath(`/viajes/${tripSlug}/lugares/[slug]`, "page");
}

export async function saveMedia(formData: FormData) {
  const { client } = await requireAdmin();
  const mediaId = text(formData, "mediaId");
  const tripSlug = text(formData, "tripSlug") || "india";
  const tripResult = await client.from("trips").select("id, slug").eq("slug", tripSlug).single();
  if (tripResult.error) throw new Error(tripResult.error.message);
  const tripId = String(tripResult.data.id);
  const current = await client.from("media").select("metadata").eq("id", mediaId).eq("trip_id", tripId).single();
  if (current.error) throw new Error(current.error.message);
  const metadata = jsonObject(current.data.metadata);
  const reviewStatus = text(formData, "reviewStatus");
  const nextStatus = reviewStatus === "pending" || reviewStatus === "rejected" ? reviewStatus : "selected";
  const mediaUpdate = await client.from("media").update({
    alt: text(formData, "alt"),
    focus: { x: decimal(formData, "focusX"), y: decimal(formData, "focusY") },
    review_status: nextStatus,
    exclusion_reason: text(formData, "exclusionReason") || null,
    metadata: { ...metadata, admin_description: text(formData, "description") },
  }).eq("id", mediaId).eq("trip_id", tripId);
  if (mediaUpdate.error) throw new Error(mediaUpdate.error.message);

  const roles = formData.getAll("role").map(String).filter((role) => mediaRoles.has(role));
  const dayId = text(formData, "dayId");
  const placeIds = formData.getAll("placeId").map(String).filter(Boolean);
  const displayOrder = Math.max(0, integer(formData, "displayOrder"));
  const removeAssignments = await client.from("media_assignments").delete().eq("media_id", mediaId).eq("trip_id", tripId);
  if (removeAssignments.error) throw new Error(removeAssignments.error.message);
  if (nextStatus !== "rejected") {
    const newAssignments: Record<string, unknown>[] = [];
    roles.filter((role) => role.startsWith("day_")).forEach((role) => { if (dayId) newAssignments.push({ trip_id: tripId, media_id: mediaId, trip_day_id: dayId, role, display_order: displayOrder }); });
    roles.filter((role) => role === "place" || role === "place_cover").forEach((role) => placeIds.forEach((placeId) => newAssignments.push({ trip_id: tripId, media_id: mediaId, place_id: placeId, role, display_order: displayOrder })));
    if (roles.includes("closing")) newAssignments.push({ trip_id: tripId, media_id: mediaId, role: "closing", display_order: displayOrder });
    if (newAssignments.length) {
      const insert = await client.from("media_assignments").insert(newAssignments);
      if (insert.error) throw new Error(insert.error.message);
    }
  }
  refreshPublic(tripSlug);
  revalidatePath(`/admin/viajes/${tripSlug}/medios`);
}

export async function removeAssignment(formData: FormData) {
  const { client } = await requireAdmin();
  const assignmentId = text(formData, "assignmentId");
  const tripSlug = text(formData, "tripSlug") || "india";
  const result = await client.from("media_assignments").delete().eq("id", assignmentId);
  if (result.error) throw new Error(result.error.message);
  refreshPublic(tripSlug);
  revalidatePath(`/admin/viajes/${tripSlug}/medios`);
}

export async function saveDay(formData: FormData) {
  const { client } = await requireAdmin();
  const tripSlug = text(formData, "tripSlug") || "india";
  const dayId = text(formData, "dayId");
  const result = await client.from("trip_days").update({ date: text(formData, "date"), title: text(formData, "title"), location: text(formData, "location"), phase: text(formData, "phase"), summary: text(formData, "summary") }).eq("id", dayId);
  if (result.error) throw new Error(result.error.message);
  refreshPublic(tripSlug);
  revalidatePath(`/admin/viajes/${tripSlug}/dias`);
}

export async function savePlace(formData: FormData) {
  const { client } = await requireAdmin();
  const tripSlug = text(formData, "tripSlug") || "india";
  const placeId = text(formData, "placeId");
  const latitude = Number.parseFloat(text(formData, "latitude"));
  const longitude = Number.parseFloat(text(formData, "longitude"));
  const result = await client.from("places").update({ name: text(formData, "name"), alternate_name: text(formData, "alternateName") || null, city: text(formData, "city"), zone: text(formData, "zone"), visit_date: text(formData, "visitDate") || null, summary: text(formData, "summary"), description: text(formData, "description"), latitude: Number.isFinite(latitude) ? latitude : null, longitude: Number.isFinite(longitude) ? longitude : null }).eq("id", placeId);
  if (result.error) throw new Error(result.error.message);
  refreshPublic(tripSlug);
  revalidatePath(`/admin/viajes/${tripSlug}/lugares`);
}

export async function activateHeroSet(formData: FormData) {
  const { client } = await requireAdmin();
  const tripSlug = text(formData, "tripSlug") || "india";
  const heroSetId = text(formData, "heroSetId");
  const trip = await client.from("trips").select("id").eq("slug", tripSlug).single();
  if (trip.error) throw new Error(trip.error.message);
  const reset = await client.from("hero_sets").update({ is_active: false }).eq("trip_id", trip.data.id);
  if (reset.error) throw new Error(reset.error.message);
  const activate = await client.from("hero_sets").update({ is_active: true }).eq("id", heroSetId).eq("trip_id", trip.data.id);
  if (activate.error) throw new Error(activate.error.message);
  refreshPublic(tripSlug);
  revalidatePath(`/admin/viajes/${tripSlug}/portadas`);
}

