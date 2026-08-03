import { createSupabasePublicClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveMediaUrl } from "@/lib/media/resolve";
import { dedupeMedia, selectVisualMedia } from "@/lib/travel-data/media-selection";
import type { ContentBlock, CoverVariant, MediaItem, Place, Trip, TripCover, TripDay, TripPlace, TripSection } from "@/types/travel";
import type { NfcResolution, PlacePageData } from "@/lib/travel-data/types";

type JsonObject = Record<string, unknown>;
type Row = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function publicPath(value: unknown, role: "full" | "thumbnail" | "poster" = "full") {
  return resolveMediaUrl(value, role);
}

function sorted(rows: Row[]) {
  return [...rows].sort((left, right) => Number(left.display_order ?? 0) - Number(right.display_order ?? 0));
}

function queryError(error: { message?: string } | null) {
  if (error) throw new Error(`No se pudo leer Supabase: ${error.message ?? "error de consulta"}`);
}

function toMedia(row: Row): MediaItem {
  const metadata = object(row.metadata);
  const focus = object(row.focus);
  const type = row.media_type === "video" ? "video" : "image";
  const orientation = row.orientation === "landscape" || row.orientation === "portrait" || row.orientation === "square" ? row.orientation : undefined;
  return {
    id: text(row.id),
    storageKey: text(row.storage_key) || undefined,
    sourceHash: text(row.source_path_hash) || undefined,
    src: publicPath(row.storage_key, "full") ?? "",
    thumbnailSrc: publicPath(row.thumbnail_key, "thumbnail") ?? null,
    alt: text(row.alt),
    type,
    width: number(row.width) ?? null,
    height: number(row.height) ?? null,
    aspectRatio: number(row.aspect_ratio) ?? null,
    orientation,
    captureDate: text(row.capture_date) || null,
    captureTime: text(row.capture_time) || null,
    fit: metadata.fit === "cover" ? "cover" : "contain",
    focus: typeof focus.x === "number" && typeof focus.y === "number" ? { x: focus.x, y: focus.y } : undefined,
    poster: publicPath(row.poster_key, "poster"),
    caption: text(metadata.caption) || undefined,
    city: text(metadata.city) || undefined,
    dayKey: text(metadata.day_key) || undefined,
    phase: text(metadata.phase) || undefined,
  };
}

function toTripPlace(row: Row, placeAssignments: Row[], mediaById: Map<string, MediaItem>): TripPlace {
  const assignments = sorted(placeAssignments.filter((assignment) => assignment.place_id === row.id));
  const mediaIds = [...new Set(assignments.filter((assignment) => assignment.role === "place").map((assignment) => text(assignment.media_id)))].filter((id) => mediaById.has(id));
  const coverMediaIds = [...new Set(assignments.filter((assignment) => assignment.role === "place_cover").map((assignment) => text(assignment.media_id)))].filter((id) => mediaById.has(id));
  const latitude = number(row.latitude);
  const longitude = number(row.longitude);
  return {
    id: text(row.id),
    slug: text(row.slug),
    name: text(row.name),
    alternateName: text(row.alternate_name) || undefined,
    city: text(row.city),
    zone: text(row.zone),
    date: text(row.visit_date),
    shortSummary: text(row.summary),
    description: text(row.description),
    coordinates: latitude !== undefined && longitude !== undefined ? { latitude, longitude } : undefined,
    locationSource: latitude !== undefined && longitude !== undefined ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}` : undefined,
    mapQuery: [text(row.name), text(row.city)].filter(Boolean).join(", "),
    verification: "high",
    mediaIds,
    coverMediaIds,
    dayKey: text(row.visit_date),
    category: text(row.category) as TripPlace["category"],
    wikipediaUrl: text(row.wikipedia_url) || undefined,
  };
}

function placeView(place: TripPlace, mediaById: Map<string, MediaItem>): Place {
  const coverId = place.coverMediaIds[0] ?? place.mediaIds[0];
  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    region: place.zone,
    status: "confirmed",
    confidence: "high",
    category: place.category,
    media: coverId ? mediaById.get(coverId) : undefined,
  };
}

function themeRoute(theme: JsonObject): Place[] {
  const route = Array.isArray(theme.route) ? theme.route : [];
  return route.map((entry) => {
    const item = object(entry);
    return { name: text(item.name), region: text(item.region), status: "confirmed", confidence: "high" };
  });
}

function themeFacts(theme: JsonObject) {
  const facts = Array.isArray(theme.facts) ? theme.facts : [];
  return facts.map((entry) => {
    const item = object(entry);
    return { label: text(item.label), value: text(item.value) };
  });
}

function coverFromHeroSet(heroSet: Row | undefined, heroSetMedia: Row[], mediaById: Map<string, MediaItem>): TripCover | undefined {
  if (!heroSet) return undefined;
  const items = dedupeMedia(sorted(heroSetMedia.filter((item) => item.hero_set_id === heroSet.id)).map((item) => {
    const media = mediaById.get(text(item.media_id));
    const focus = object(item.focus);
    return media && typeof focus.x === "number" && typeof focus.y === "number" ? { ...media, focus: { x: focus.x, y: focus.y }, fit: "cover" as const } : media;
  }).filter((item): item is MediaItem => Boolean(item)));
  const images = items.filter((item) => item.type === "image");
  const video = items.find((item) => item.type === "video");
  const variant = text(heroSet.name).toLowerCase();
  const validVariant: CoverVariant | undefined = variant === "a" || variant === "b" || variant === "c" || variant === "d" ? variant : undefined;
  return {
    mode: heroSet.layout === "video" ? "video" : heroSet.layout === "slideshow" ? "slideshow" : "collage",
    variant: validVariant,
    media: images,
    video,
    fallback: images[0] ?? video ?? items[0] ?? { id: "missing", src: "", alt: "Portada del viaje", type: "image", fit: "cover" },
  };
}

export async function loadSupabaseTrip(client: SupabaseClient, tripRow: Row): Promise<Trip> {
  const tripId = text(tripRow.id);
  const [daysResult, placesResult, joinsResult, mediaResult, assignmentsResult, heroSetsResult, heroSetMediaResult, sectionsResult, sectionMediaResult] = await Promise.all([
    client.from("trip_days").select("*").eq("trip_id", tripId).order("display_order"),
    client.from("places").select("*").eq("trip_id", tripId).order("display_order"),
    client.from("trip_day_places").select("*").order("display_order"),
    client.from("media").select("*").eq("trip_id", tripId),
    client.from("media_assignments").select("*").eq("trip_id", tripId).order("display_order"),
    client.from("hero_sets").select("*").eq("trip_id", tripId).order("display_order"),
    client.from("hero_set_media").select("*").order("display_order"),
    client.from("trip_sections").select("*").eq("trip_id", tripId).order("display_order"),
    client.from("trip_section_media").select("*").order("display_order"),
  ]);
  [daysResult, placesResult, joinsResult, mediaResult, assignmentsResult, heroSetsResult, heroSetMediaResult, sectionsResult, sectionMediaResult].forEach((result) => queryError(result.error));

  const daysRows = (daysResult.data ?? []) as Row[];
  const placesRows = (placesResult.data ?? []) as Row[];
  const joins = (joinsResult.data ?? []) as Row[];
  const mediaRows = (mediaResult.data ?? []) as Row[];
  const assignments = (assignmentsResult.data ?? []) as Row[];
  const heroSets = (heroSetsResult.data ?? []) as Row[];
  const heroSetMedia = (heroSetMediaResult.data ?? []) as Row[];
  const sections = (sectionsResult.data ?? []) as Row[];
  const sectionMedia = (sectionMediaResult.data ?? []) as Row[];
  const visibleMediaRows = mediaRows.filter((row) => text(row.review_status, "selected") === "selected");
  const mediaById = new Map(visibleMediaRows.map((row) => [text(row.id), toMedia(row)]));
  const mediaDisplayOrder = new Map(visibleMediaRows.map((row) => [text(row.id), number(object(row.metadata).display_order) ?? Number.MAX_SAFE_INTEGER]));
  const places = placesRows.map((row) => toTripPlace(row, assignments, mediaById));
  const placesById = new Map(places.map((place) => [place.id, place]));
  const days = sorted(daysRows).map((dayRow) => {
    const dayId = text(dayRow.id);
    const dayAssignments = sorted(assignments.filter((assignment) => assignment.trip_day_id === dayId));
    const dayMedia = (role: string) => dayAssignments.filter((assignment) => assignment.role === role).map((assignment) => mediaById.get(text(assignment.media_id))).filter((media): media is MediaItem => Boolean(media));
    const gallery = dedupeMedia(dayMedia("day_gallery"));
    const heroImage = dayMedia("day_hero")[0] ?? gallery[0] ?? [...mediaById.values()][0];
    const mosaic = selectVisualMedia(dayMedia("day_mosaic"), { excludeIds: heroImage ? [heroImage.id] : [], limit: 4, preferVariety: true });
    const video = dayMedia("day_video").find((item) => item.id !== heroImage?.id && !mosaic.some((candidate) => candidate.id === item.id));
    const dayPlaces = sorted(joins.filter((join) => join.trip_day_id === dayId)).map((join) => placesById.get(text(join.place_id))).filter((place): place is TripPlace => Boolean(place));
    const placesVisited = dayPlaces.length > 0 ? dayPlaces.map((place) => placeView(place, mediaById)) : [{ name: text(dayRow.location) === "Salida" ? "Vuelo de salida" : text(dayRow.location), region: text(dayRow.location) }];
    return {
      id: dayId,
      dayNumber: Number(dayRow.day_number),
      date: text(dayRow.date),
      title: text(dayRow.title),
      city: text(dayRow.location),
      phase: text(dayRow.phase),
      confidence: "high" as const,
      placeCandidates: dayPlaces.map((place) => ({ name: place.name, confidence: "high" as const, reason: place.shortSummary })),
      location: { name: text(dayRow.location), region: text(object(tripRow.theme).country), status: "confirmed" as const, confidence: "high" as const },
      factualDescription: text(dayRow.summary),
      placesVisited,
      heroImage: heroImage ?? { id: "missing", src: "", alt: "Imagen de la jornada", type: "image" as const },
      mosaic,
      video,
      gallery,
    } satisfies TripDay;
  });

  const theme = object(tripRow.theme);
  const coverVariants = Object.fromEntries(heroSets.map((set) => [text(set.name).toLowerCase(), coverFromHeroSet(set, heroSetMedia, mediaById)]).filter((entry): entry is [string, TripCover] => Boolean(entry[1]))) as Partial<Record<CoverVariant, TripCover>>;
  const activeHeroSet = heroSets.find((set) => Boolean(set.is_active));
  const activeVariant = text(activeHeroSet?.name).toLowerCase();
  const activeCover = activeVariant === "a" || activeVariant === "b" || activeVariant === "c" || activeVariant === "d" ? coverVariants[activeVariant] : undefined;
  const defaultCover = activeCover ?? coverVariants.a ?? Object.values(coverVariants)[0] ?? { mode: "collage" as const, media: [], fallback: [...mediaById.values()][0] ?? { id: "missing", src: "", alt: "Portada del viaje", type: "image" as const } };
  const closingTheme = object(theme.closing);
  const closingMediaLocalId = text(closingTheme.localMediaId);
  const closingMedia = visibleMediaRows.find((row) => text(object(row.metadata).local_id) === closingMediaLocalId);
  const closingMediaItem = closingMedia ? mediaById.get(text(closingMedia.id)) : [...mediaById.values()][mediaById.size - 1];
  const tripSections: TripSection[] = sorted(sections).map((section) => {
    const items = sorted(sectionMedia.filter((item) => text(item.section_id) === text(section.id)))
      .map((item) => mediaById.get(text(item.media_id)))
      .filter((media): media is MediaItem => Boolean(media));
    const blocks: Array<Extract<ContentBlock, { type: "gallery" }>> = section.is_gallery === false ? [] : [{ type: "gallery", title: text(section.title), items }];
    return {
      id: text(section.id),
      title: text(section.title),
      description: text(section.description),
      displayOrder: Number(section.display_order ?? 0),
      afterDayNumber: typeof section.after_day_number === "number" ? section.after_day_number : undefined,
      initiallyClosed: section.initially_closed !== false,
      blocks,
    };
  }).filter((section) => section.blocks.length > 0);
  const trip: Trip = {
    slug: text(tripRow.slug),
    title: text(tripRow.title),
    dates: text(theme.dates, `${text(tripRow.start_date)} - ${text(tripRow.end_date)}`),
    intro: text(theme.intro, text(tripRow.summary)),
    hero: defaultCover.fallback,
    cover: defaultCover,
    coverVariants: coverVariants as Record<CoverVariant, TripCover>,
    facts: themeFacts(theme),
    route: themeRoute(theme),
    days,
    sections: tripSections,
    gallery: dedupeMedia([...mediaById.values()].sort((left, right) => (mediaDisplayOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (mediaDisplayOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER))),
    closing: {
      type: "closing",
      title: text(closingTheme.title, text(tripRow.title)),
      body: text(closingTheme.body, text(tripRow.end_date)),
      media: closingMediaItem ?? defaultCover.fallback,
    },
  };
  return trip;
}

export async function getSupabaseTripBySlug(slug: string) {
  const client = createSupabasePublicClient();
  const result = await client.from("trips").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  queryError(result.error);
  return result.data ? loadSupabaseTrip(client, result.data as Row) : undefined;
}

export async function getSupabaseTripById(client: SupabaseClient, id: string, includeDraft = false) {
  let query = client.from("trips").select("*").eq("id", id);
  if (!includeDraft) query = query.eq("status", "published");
  const result = await query.maybeSingle();
  queryError(result.error);
  return result.data ? loadSupabaseTrip(client, result.data as Row) : undefined;
}

export async function getSupabasePlacePage(slug: string, tripSlug = "india"): Promise<PlacePageData | undefined> {
  const client = createSupabasePublicClient();
  const placeResult = await client.from("places").select("*, trips!inner(slug, status)").eq("slug", slug).eq("trips.slug", tripSlug).eq("trips.status", "published").maybeSingle();
  queryError(placeResult.error);
  if (!placeResult.data) return undefined;
  const placeRow = placeResult.data as Row;
  const tripId = text(placeRow.trip_id);
  const tripResult = await client.from("trips").select("*").eq("id", tripId).eq("status", "published").maybeSingle();
  queryError(tripResult.error);
  if (!tripResult.data) return undefined;
  const trip = await loadSupabaseTrip(client, tripResult.data as Row);
  const [placesResult, assignmentsResult, mediaResult] = await Promise.all([
    client.from("places").select("*").eq("trip_id", tripId).order("display_order"),
    client.from("media_assignments").select("*").eq("trip_id", tripId),
    client.from("media").select("*").eq("trip_id", tripId),
  ]);
  [placesResult, assignmentsResult, mediaResult].forEach((result) => queryError(result.error));
  const tripPlaces = (placesResult.data ?? []) as Row[];
  const assignments = (assignmentsResult.data ?? []) as Row[];
  const mediaRows = (mediaResult.data ?? []) as Row[];
  const visibleMediaRows = mediaRows.filter((row) => text(row.review_status, "selected") === "selected");
  const mediaById = new Map(visibleMediaRows.map((row) => [text(row.id), toMedia(row)]));
  const placeAssignments = assignments.filter((assignment) => assignment.place_id === placeRow.id);
  const fullPlace = toTripPlace(placeRow, placeAssignments, mediaById);
  const fullPlaces = tripPlaces.map((row) => toTripPlace(row, assignments, mediaById));
  const placeIndex = fullPlaces.findIndex((candidate) => candidate.id === fullPlace.id);
  const day = trip.days.find((candidate) => candidate.date === fullPlace.dayKey);
  const placeMedia = dedupeMedia([
    ...fullPlace.coverMediaIds.map((id) => mediaById.get(id)),
    ...fullPlace.mediaIds.map((id) => mediaById.get(id)),
  ].filter((media): media is MediaItem => Boolean(media)));
  return {
    place: fullPlace,
    media: placeMedia,
    day,
    previousPlace: placeIndex > 0 ? fullPlaces[placeIndex - 1] : undefined,
    nextPlace: placeIndex >= 0 ? fullPlaces[placeIndex + 1] : undefined,
    trip,
  };
}

export async function resolveSupabaseNfc(code: string): Promise<NfcResolution | undefined> {
  const client = createSupabasePublicClient();
  const result = await client.from("nfc_links").select("code, is_active, trips!inner(slug, status)").eq("code", code).eq("is_active", true).eq("trips.status", "published").maybeSingle();
  queryError(result.error);
  if (!result.data) return undefined;
  const trip = Array.isArray(result.data.trips) ? result.data.trips[0] : result.data.trips;
  const slug = trip && typeof trip === "object" ? text((trip as Row).slug) : "";
  return slug ? { tripSlug: slug, isActive: true } : undefined;
}
