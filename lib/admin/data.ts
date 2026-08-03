import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveMediaUrl } from "@/lib/media/resolve";

type Row = Record<string, unknown>;

export type AdminAssignment = {
  id: string;
  role: string;
  displayOrder: number;
  dayId?: string;
  placeId?: string;
  dayTitle?: string;
  placeName?: string;
};

export type AdminMedia = {
  id: string;
  originalFileName: string;
  storageKey: string;
  previewUrl?: string;
  thumbnailKey: string | null;
  posterKey: string | null;
  mediaType: "image" | "video";
  width: number | null;
  height: number | null;
  orientation: string;
  captureDate: string;
  captureTime: string;
  alt: string;
  description: string;
  city: string;
  dayKey: string;
  phase: string;
  reviewStatus: "pending" | "selected" | "rejected";
  exclusionReason: string;
  focusX: number;
  focusY: number;
  assignments: AdminAssignment[];
};

export type AdminDay = { id: string; dayNumber: number; date: string; title: string; location: string; phase: string; summary: string };
export type AdminPlace = { id: string; slug: string; name: string; alternateName: string; city: string; zone: string; visitDate: string; summary: string; description: string; category: string; latitude: number | null; longitude: number | null };
export type AdminHeroSet = { id: string; name: string; layout: string; isActive: boolean; mediaIds: string[] };
export type AdminTrip = {
  id: string;
  slug: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  summary: string;
  days: AdminDay[];
  places: AdminPlace[];
  media: AdminMedia[];
  heroSets: AdminHeroSet[];
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function object(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
}

function status(value: unknown): AdminMedia["reviewStatus"] {
  return value === "pending" || value === "rejected" ? value : "selected";
}

export async function getAdminTrips(client: SupabaseClient) {
  const result = await client.from("trips").select("*").order("created_at", { ascending: false });
  if (result.error) throw new Error(result.error.message);
  return ((result.data ?? []) as Row[]).map((trip) => ({
    id: text(trip.id),
    slug: text(trip.slug),
    title: text(trip.title),
    status: text(trip.status),
    startDate: text(trip.start_date),
    endDate: text(trip.end_date),
    summary: text(trip.summary),
  }));
}

export async function getAdminTrip(client: SupabaseClient, slug: string): Promise<AdminTrip | undefined> {
  const tripResult = await client.from("trips").select("*").eq("slug", slug).maybeSingle();
  if (tripResult.error) throw new Error(tripResult.error.message);
  if (!tripResult.data) return undefined;
  const trip = tripResult.data as Row;
  const tripId = text(trip.id);
  const [daysResult, placesResult, mediaResult, assignmentsResult, heroSetsResult, heroSetMediaResult] = await Promise.all([
    client.from("trip_days").select("*").eq("trip_id", tripId).order("display_order"),
    client.from("places").select("*").eq("trip_id", tripId).order("display_order"),
    client.from("media").select("*").eq("trip_id", tripId).order("capture_date").order("capture_time"),
    client.from("media_assignments").select("*").eq("trip_id", tripId).order("display_order"),
    client.from("hero_sets").select("*").eq("trip_id", tripId).order("display_order"),
    client.from("hero_set_media").select("*").order("display_order"),
  ]);
  [daysResult, placesResult, mediaResult, assignmentsResult, heroSetsResult, heroSetMediaResult].forEach((result) => {
    if (result.error) throw new Error(result.error.message);
  });

  const days = ((daysResult.data ?? []) as Row[]).map((day) => ({
    id: text(day.id), dayNumber: number(day.day_number), date: text(day.date), title: text(day.title), location: text(day.location), phase: text(day.phase), summary: text(day.summary),
  }));
  const places = ((placesResult.data ?? []) as Row[]).map((place) => ({
    id: text(place.id), slug: text(place.slug), name: text(place.name), alternateName: text(place.alternate_name), city: text(place.city), zone: text(place.zone), visitDate: text(place.visit_date), summary: text(place.summary), description: text(place.description), category: text(place.category), latitude: typeof place.latitude === "number" ? place.latitude : null, longitude: typeof place.longitude === "number" ? place.longitude : null,
  }));
  const dayById = new Map(days.map((day) => [day.id, day]));
  const placeById = new Map(places.map((place) => [place.id, place]));
  const assignments = (assignmentsResult.data ?? []) as Row[];
  const media = ((mediaResult.data ?? []) as Row[]).map((row) => {
    const metadata = object(row.metadata);
    const focus = object(row.focus);
    const mediaAssignments = assignments.filter((assignment) => text(assignment.media_id) === text(row.id)).map((assignment) => {
      const day = dayById.get(text(assignment.trip_day_id));
      const place = placeById.get(text(assignment.place_id));
      return { id: text(assignment.id), role: text(assignment.role), displayOrder: number(assignment.display_order), dayId: day?.id, placeId: place?.id, dayTitle: day?.title, placeName: place?.name };
    });
    return {
      id: text(row.id),
      originalFileName: text(metadata.original_file_name, text(metadata.local_id, text(row.storage_key))),
      storageKey: text(row.storage_key),
      previewUrl: resolveMediaUrl(row.thumbnail_key ?? row.storage_key, row.thumbnail_key ? "thumbnail" : "full"),
      thumbnailKey: typeof row.thumbnail_key === "string" ? row.thumbnail_key : null,
      posterKey: typeof row.poster_key === "string" ? row.poster_key : null,
      mediaType: row.media_type === "video" ? "video" as const : "image" as const,
      width: typeof row.width === "number" ? row.width : null,
      height: typeof row.height === "number" ? row.height : null,
      orientation: text(row.orientation, "square"),
      captureDate: text(row.capture_date),
      captureTime: text(row.capture_time),
      alt: text(row.alt),
      description: text(metadata.admin_description, text(metadata.description, text(metadata.caption))),
      city: text(metadata.city),
      dayKey: text(metadata.day_key),
      phase: text(metadata.phase),
      reviewStatus: status(row.review_status),
      exclusionReason: text(row.exclusion_reason),
      focusX: number(focus.x, 50),
      focusY: number(focus.y, 50),
      assignments: mediaAssignments,
    };
  });
  const heroMedia = (heroSetMediaResult.data ?? []) as Row[];
  const heroSets = ((heroSetsResult.data ?? []) as Row[]).map((set) => ({
    id: text(set.id), name: text(set.name), layout: text(set.layout), isActive: Boolean(set.is_active),
    mediaIds: heroMedia.filter((item) => text(item.hero_set_id) === text(set.id)).sort((a, b) => number(a.display_order) - number(b.display_order)).map((item) => text(item.media_id)),
  }));
  return { id: tripId, slug: text(trip.slug), title: text(trip.title), status: text(trip.status), startDate: text(trip.start_date), endDate: text(trip.end_date), summary: text(trip.summary), days, places, media, heroSets };
}
