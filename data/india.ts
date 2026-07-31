import mediaManifestJson from "./india-media-manifest.json";
import { getIndiaPlace, indiaPlaces } from "./india-places";
import type { ConfidenceLevel, CoverVariant, IndiaMediaManifest, IndiaMediaRecord, MediaItem, Place, PlaceCandidate, Trip, TripDay } from "@/types/travel";

const mediaManifest = mediaManifestJson as IndiaMediaManifest;
const importedRecords = mediaManifest.files.filter((record) => record.imported && record.src);
const imageRecords = importedRecords.filter((record) => record.type === "image");

const dayCopy: Record<number, { date: string; city: string; phase: string; title: string; summary: string }> = {
  0: { date: "2018-09-02", city: "Salida", phase: "Salida y vuelo", title: "Salida y vuelo a India", summary: "Salida desde España, llegada al aeropuerto y vuelo hacia India." },
  1: { date: "2018-09-03", city: "Delhi", phase: "Delhi", title: "Primer día en Delhi", summary: "Visita de Jama Masjid, Gurdwara Bangla Sahib y Raj Ghat durante la primera jornada en Delhi." },
  2: { date: "2018-09-04", city: "Delhi", phase: "Delhi", title: "Sur de Delhi", summary: "Recorrido por Qutb Minar y el Templo del Loto, con fotografías de calles y del alojamiento en Delhi." },
  3: { date: "2018-09-05", city: "Jaipur", phase: "Delhi → Jaipur", title: "Camino a Jaipur", summary: "Traslado por carretera desde Delhi, llegada a Shahpura Haveli y recorrido en 4x4 por los alrededores." },
  4: { date: "2018-09-06", city: "Jaipur", phase: "Jaipur", title: "Amber y Jaipur", summary: "Visita de Amber Fort, recorrido en elefante, desplazamiento en tuk-tuk, Jal Mahal y parada en una fábrica de alfombras." },
  5: { date: "2018-09-07", city: "Agra", phase: "Jaipur → Agra", title: "Camino a Agra", summary: "Traslado hacia Agra con paradas en Chand Baori, Laxmi Vilas Palace y otros puntos de la ruta." },
  6: { date: "2018-09-08", city: "Agra", phase: "Agra", title: "Taj Mahal y Fuerte de Agra", summary: "Visita del Taj Mahal y del Fuerte de Agra durante la jornada principal en la ciudad." },
  7: { date: "2018-09-09", city: "Agra", phase: "Agra", title: "Hotel y piscina", summary: "Jornada de alojamiento en Agra, con fotografías de la piscina y del entorno del hotel." },
  8: { date: "2018-09-10", city: "Regreso", phase: "Agra → Delhi → regreso", title: "Regreso y aeropuerto", summary: "Salida de Agra, regreso por Delhi y vuelo de vuelta desde el aeropuerto." },
};

function confidenceRank(confidence: ConfidenceLevel) {
  return confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
}

function uniqueCandidates(records: IndiaMediaRecord[], date: string) {
  const candidates = new Map<string, PlaceCandidate>();
  for (const place of indiaPlaces.filter((item) => item.dayKey === date)) {
    candidates.set(place.name, { name: place.name, confidence: place.verification, reason: place.shortSummary });
  }
  for (const record of records) {
    for (const candidate of record.placeCandidates) {
      const previous = candidates.get(candidate.name);
      if (!previous || confidenceRank(candidate.confidence) > confidenceRank(previous.confidence)) candidates.set(candidate.name, candidate);
    }
  }
  return [...candidates.values()];
}

function toMedia(record: IndiaMediaRecord, overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: record.id,
    src: record.src,
    thumbnailSrc: record.thumbnailSrc,
    alt: mediaAlt(record),
    type: record.type,
    width: record.width,
    height: record.height,
    aspectRatio: record.aspectRatio,
    orientation: record.orientation,
    captureDate: record.captureDate,
    captureTime: record.captureTime,
    fit: record.fit ?? "contain",
    city: record.city,
    dayKey: record.dayKey,
    phase: record.phase,
    ...overrides,
  };
}

function mediaAlt(record: IndiaMediaRecord) {
  const places = (record.editorialPlaceIds ?? []).map((id) => getIndiaPlace(id)).filter(Boolean);
  if (places.length > 0) return `${places.map((place) => place?.name).join(" y ")} en ${places[0]?.city ?? record.city}`;
  if (record.dayKey === "2018-09-02") return "Salida y vuelo a India";
  if (record.dayKey === "2018-09-10") return "Aeropuerto de Delhi y regreso";
  return `Escena del recorrido en ${record.city}`;
}

function dayRecords(dayNumber: number) {
  return importedRecords.filter((record) => record.tripDayNumber === dayNumber).sort((a, b) => `${a.captureTime ?? ""}`.localeCompare(`${b.captureTime ?? ""}`));
}

function dayPlaces(date: string, city: string): Place[] {
  const places = indiaPlaces.filter((place) => place.dayKey === date);
  if (places.length === 0) return [{ name: city === "Salida" ? "Vuelo de salida" : "Aeropuerto de Delhi", region: city }];
  return places.map((place) => {
    const coverId = place.coverMediaIds[0];
    const coverRecord = importedRecords.find((record) => record.id === coverId);
    return {
      id: place.id,
      slug: place.slug,
      name: place.name,
      region: place.zone,
      status: "confirmed",
      confidence: place.verification,
      category: place.category,
      media: coverRecord ? toMedia(coverRecord) : undefined,
    };
  });
}

function buildDay(dayNumber: number): TripDay {
  const config = dayCopy[dayNumber];
  const records = dayRecords(dayNumber);
  const images = records.filter((record) => record.type === "image");
  const videos = records.filter((record) => record.type === "video");
  const heroRecord = images.find((record) => record.orientation === "landscape") ?? images[0] ?? imageRecords[0];
  const hero = toMedia(heroRecord);
  const candidates = uniqueCandidates(records, config.date);
  const confidence = candidates.reduce<ConfidenceLevel>((best, candidate) => confidenceRank(candidate.confidence) > confidenceRank(best) ? candidate.confidence : best, "low");
  const videoRecord = videos[0];
  const video = videoRecord ? toMedia(videoRecord, { poster: hero.src, caption: videoRecord.id.includes("090358") ? "Parada en Jal Mahal durante la jornada de Jaipur." : "Escena del recorrido del día." }) : undefined;
  return {
    id: `day-${String(dayNumber).padStart(2, "0")}`,
    dayNumber,
    date: config.date,
    title: config.title,
    city: config.city,
    phase: config.phase,
    confidence,
    placeCandidates: candidates,
    location: { name: config.city, region: "India", status: "confirmed", confidence: "high" },
    factualDescription: config.summary,
    placesVisited: dayPlaces(config.date, config.city),
    heroImage: hero,
    mosaic: images.filter((record) => record.id !== hero.id).slice(0, 3).map((record) => toMedia(record)),
    video,
    gallery: images.map((record) => toMedia(record)),
  };
}

const days = Object.keys(dayCopy).map(Number).map(buildDay);

function findImportedRecord(fragment: string) {
  const record = importedRecords.find((item) => item.id.includes(fragment));
  if (!record) throw new Error(`No se encontro el medio local de portada: ${fragment}`);
  return record;
}

function coverImage(fragment: string) {
  return toMedia(findImportedRecord(fragment), { fit: "cover" });
}

const coverA = [
  coverImage("2018-09-08-img-20180908-083656-tajmahal"),
  coverImage("2018-09-03-img-20180903-124657-gurdwarabanglasahib"),
  coverImage("2018-09-05-img-20180905-143905"),
];
const coverB = [
  coverImage("2018-09-03-img-20180903-124657-gurdwarabanglasahib"),
  coverImage("2018-09-08-img-20180908-083656-tajmahal"),
  coverImage("2018-09-06-img-20180906-181156-recorridoelefantesjaipur"),
];
const coverC = [
  coverImage("2018-09-08-img-20180908-083656-tajmahal"),
  coverImage("2018-09-07-img-20180907-112810"),
  coverImage("2018-09-04-img-20180904-113548"),
  coverImage("2018-09-09-img-20180909-092844-fotopiscinahotelagra"),
];
const coverD = [
  coverImage("2018-09-05-img-20180905-124934"),
  coverImage("2018-09-04-img-20180904-113548"),
];
const coverVideo = toMedia(findImportedRecord("2018-09-06-vid-20180906-090358-palacioenelagua"), { poster: coverD[0].src });

export const indiaCoverVariants: Record<CoverVariant, Trip["cover"]> = {
  a: { mode: "collage", variant: "a", media: coverA, fallback: coverA[0] },
  b: { mode: "collage", variant: "b", media: coverB, fallback: coverB[0] },
  c: { mode: "collage", variant: "c", media: coverC, fallback: coverC[0] },
  d: { mode: "video", variant: "d", media: coverD, video: coverVideo, fallback: coverD[0] },
};

export function getIndiaCoverVariant(value?: string) {
  const normalized = value?.toLowerCase();
  const key: CoverVariant = normalized === "b" || normalized === "c" || normalized === "d" ? normalized : "a";
  return indiaCoverVariants[key];
}

const route: Place[] = [
  { name: "Delhi", region: "Inicio", status: "confirmed", confidence: "high" },
  { name: "Jaipur", region: "Parada", status: "confirmed", confidence: "high" },
  { name: "Agra", region: "Tramo final", status: "confirmed", confidence: "high" },
  { name: "Regreso", region: "Delhi y aeropuerto", status: "confirmed", confidence: "high" },
];

const allMedia = importedRecords.map((record) => {
  const day = days.find((item) => item.date === record.captureDate);
  return toMedia(record, record.type === "video" && day ? { poster: day.heroImage.src } : undefined);
});

export const indiaTrip: Trip = {
  slug: "india",
  title: "India",
  dates: "2-10 septiembre 2018",
  intro: "Viaje por Delhi, Jaipur y Agra del 2 al 10 de septiembre de 2018. El relato conserva la salida, el recorrido Delhi → Jaipur → Agra y el regreso por Delhi.",
  hero: toMedia(imageRecords.find((record) => record.eligibleForCover) ?? imageRecords[0], { fit: "cover" }),
  cover: indiaCoverVariants.a,
  facts: [
    { label: "Fechas", value: "2-10 sep 2018" },
    { label: "Jornadas", value: "Día 0 + 8 jornadas" },
    { label: "Ruta", value: "Delhi → Jaipur → Agra → regreso" },
    { label: "Recorrido", value: "Delhi · Jaipur · Agra" },
  ],
  route,
  days,
  gallery: allMedia,
  closing: {
    type: "closing",
    title: "India",
    body: "2–10 de septiembre de 2018",
    media: toMedia(imageRecords.find((record) => record.captureDate === "2018-09-10") ?? imageRecords[imageRecords.length - 1], { fit: "cover" }),
  },
};

export function placeDay(placeSlug: string) {
  const place = getIndiaPlace(placeSlug);
  return place ? days.find((day) => day.date === place.dayKey) : undefined;
}
