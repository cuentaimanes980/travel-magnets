import { createHash } from "node:crypto";
import { indiaCoverVariants, indiaTrip } from "@/data/india";
import { indiaPlaces } from "@/data/india-places";
import type { CoverVariant, MediaItem } from "@/types/travel";

export type IndiaSeed = {
  trips: Record<string, unknown>[];
  trip_days: Record<string, unknown>[];
  places: Record<string, unknown>[];
  trip_day_places: Record<string, unknown>[];
  media: Record<string, unknown>[];
  media_assignments: Record<string, unknown>[];
  hero_sets: Record<string, unknown>[];
  hero_set_media: Record<string, unknown>[];
  nfc_links: Record<string, unknown>[];
};

function stableId(value: string) {
  const hex = createHash("sha256").update(`travel-magnets:${value}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

function assignmentId(key: string) {
  return stableId(`assignment:${key}`);
}

function mediaRow(id: string, item: MediaItem, index: number) {
  return {
    id,
    trip_id: stableId("trip:india"),
    storage_key: item.src,
    thumbnail_key: item.thumbnailSrc ?? null,
    poster_key: item.poster ?? null,
    media_type: item.type,
    width: item.width ?? null,
    height: item.height ?? null,
    aspect_ratio: item.aspectRatio ?? null,
    orientation: item.orientation ?? null,
    alt: item.alt,
    focus: item.focus ?? {},
    capture_date: item.captureDate ?? null,
    capture_time: item.captureTime ?? null,
    metadata: {
      local_id: item.id,
      city: item.city ?? "",
      day_key: item.dayKey ?? "",
      phase: item.phase ?? "",
      fit: item.fit ?? "contain",
      caption: item.caption ?? "",
      display_order: index,
    },
  };
}

function assignment(mediaId: string, role: string, order: number, target: { trip_day_id?: string; place_id?: string } = {}) {
  return {
    id: assignmentId(`${role}:${target.trip_day_id ?? target.place_id ?? "trip"}:${mediaId}:${order}`),
    trip_id: stableId("trip:india"),
    media_id: mediaId,
    trip_day_id: target.trip_day_id ?? null,
    place_id: target.place_id ?? null,
    role,
    display_order: order,
    layout_hint: null,
    metadata: {},
  };
}

export function buildIndiaSeed(): IndiaSeed {
  const tripId = stableId("trip:india");
  const allMedia = indiaTrip.gallery;
  const mediaIds = new Map(allMedia.map((item) => [item.id, stableId(`media:${item.id}`)]));
  const dayIds = new Map(indiaTrip.days.map((day) => [day.date, stableId(`day:${day.date}`)]));
  const placeIds = new Map(indiaPlaces.map((place) => [place.id, stableId(`place:${place.id}`)]));
  const theme = {
    dates: indiaTrip.dates,
    intro: indiaTrip.intro,
    facts: indiaTrip.facts,
    route: indiaTrip.route.map(({ name, region }) => ({ name, region })),
    closing: {
      title: indiaTrip.closing.title,
      body: indiaTrip.closing.body,
      localMediaId: indiaTrip.closing.media.id,
    },
    defaultCover: "a",
  };

  const seed: IndiaSeed = {
    trips: [{
      id: tripId,
      slug: indiaTrip.slug,
      title: indiaTrip.title,
      start_date: "2018-09-02",
      end_date: "2018-09-10",
      summary: indiaTrip.intro,
      status: "published",
      hero_mode: indiaTrip.cover.mode,
      theme,
    }],
    trip_days: indiaTrip.days.map((day) => ({
      id: dayIds.get(day.date),
      trip_id: tripId,
      day_number: day.dayNumber,
      date: day.date,
      title: day.title,
      location: day.city,
      phase: day.phase,
      summary: day.factualDescription,
      display_order: day.dayNumber,
    })),
    places: indiaPlaces.map((place, index) => ({
      id: placeIds.get(place.id),
      trip_id: tripId,
      slug: place.slug,
      name: place.name,
      alternate_name: place.alternateName ?? null,
      city: place.city,
      zone: place.zone,
      visit_date: place.date,
      summary: place.shortSummary,
      description: place.description,
      latitude: place.coordinates?.latitude ?? null,
      longitude: place.coordinates?.longitude ?? null,
      category: place.category,
      display_order: index,
    })),
    trip_day_places: [],
    media: allMedia.map((item, index) => mediaRow(mediaIds.get(item.id)!, item, index)),
    media_assignments: [],
    hero_sets: [],
    hero_set_media: [],
    nfc_links: [{
      id: stableId("nfc:india-2018"),
      code: "india-2018",
      trip_id: tripId,
      is_active: false,
    }],
  };

  for (const day of indiaTrip.days) {
    const dayId = dayIds.get(day.date)!;
    const placesForDay = indiaPlaces.filter((place) => place.dayKey === day.date);
    placesForDay.forEach((place, index) => seed.trip_day_places.push({ trip_day_id: dayId, place_id: placeIds.get(place.id), display_order: index }));
    seed.media_assignments.push(assignment(mediaIds.get(day.heroImage.id)!, "day_hero", 0, { trip_day_id: dayId }));
    day.mosaic.forEach((item, index) => seed.media_assignments.push(assignment(mediaIds.get(item.id)!, "day_mosaic", index, { trip_day_id: dayId })));
    day.gallery.forEach((item, index) => seed.media_assignments.push(assignment(mediaIds.get(item.id)!, "day_gallery", index, { trip_day_id: dayId })));
    if (day.video) seed.media_assignments.push(assignment(mediaIds.get(day.video.id)!, "day_video", 0, { trip_day_id: dayId }));
  }

  indiaPlaces.forEach((place) => {
    const dbPlaceId = placeIds.get(place.id)!;
    place.mediaIds.forEach((mediaId, index) => seed.media_assignments.push(assignment(mediaIds.get(mediaId)!, "place", index, { place_id: dbPlaceId })));
    place.coverMediaIds.forEach((mediaId, index) => seed.media_assignments.push(assignment(mediaIds.get(mediaId)!, "place_cover", index, { place_id: dbPlaceId })));
  });
  seed.media_assignments.push(assignment(mediaIds.get(indiaTrip.closing.media.id)!, "closing", 0));

  (Object.entries(indiaCoverVariants) as [CoverVariant, typeof indiaCoverVariants.a][]).forEach(([variant, cover], index) => {
    const heroSetId = stableId(`hero-set:${variant}`);
    seed.hero_sets.push({ id: heroSetId, trip_id: tripId, name: variant, layout: cover.mode, display_order: index, is_active: variant === "a" });
    [...cover.media, ...(cover.video ? [cover.video] : [])].forEach((item, slot) => seed.hero_set_media.push({
      hero_set_id: heroSetId,
      media_id: mediaIds.get(item.id),
      slot,
      display_order: slot,
      focus: item.focus ?? {},
    }));
  });

  return seed;
}

export function indiaSeedSummary(seed = buildIndiaSeed()) {
  return {
    trips: seed.trips.length,
    days: seed.trip_days.length,
    places: seed.places.length,
    dayPlaceRelations: seed.trip_day_places.length,
    photos: seed.media.filter((row) => row.media_type === "image").length,
    videos: seed.media.filter((row) => row.media_type === "video").length,
    mediaAssignments: seed.media_assignments.length,
    heroSets: seed.hero_sets.length,
    heroSetMedia: seed.hero_set_media.length,
    nfcLinks: seed.nfc_links.length,
  };
}
