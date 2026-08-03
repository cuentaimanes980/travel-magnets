import { getIndiaCoverVariant, indiaTrip } from "@/data/india";
import { getIndiaDayId, getIndiaPlace, getIndiaPlaceMedia, indiaPlaces } from "@/data/india-places";
import type { PlacePageData, NfcResolution } from "@/lib/travel-data/types";

export function getLocalTripBySlug(slug: string) {
  return slug === indiaTrip.slug ? indiaTrip : undefined;
}

export function getLocalPlaceSlugs() {
  return indiaPlaces.map((place) => place.slug);
}

export function getLocalPlacePage(slug: string, tripSlug = "india"): PlacePageData | undefined {
  if (tripSlug !== indiaTrip.slug) return undefined;
  const place = getIndiaPlace(slug);
  if (!place) return undefined;
  const index = indiaPlaces.findIndex((candidate) => candidate.id === place.id);
  const day = indiaTrip.days.find((candidate) => candidate.date === place.dayKey);
  return {
    place,
    media: getIndiaPlaceMedia(place),
    day,
    previousPlace: index > 0 ? indiaPlaces[index - 1] : undefined,
    nextPlace: index >= 0 ? indiaPlaces[index + 1] : undefined,
    trip: indiaTrip,
  };
}

export function resolveLocalNfc(code: string): NfcResolution | undefined {
  return code === "india-2018" ? { tripSlug: indiaTrip.slug, isActive: true } : undefined;
}

export function getLocalCoverVariant(value?: string) {
  return getIndiaCoverVariant(value);
}

export function getLocalDayId(date: string) {
  return getIndiaDayId(date);
}
