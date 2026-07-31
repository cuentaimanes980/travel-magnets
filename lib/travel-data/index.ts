import type { CoverVariant, Trip } from "@/types/travel";
import { getSupabasePlacePage, getSupabaseTripBySlug, resolveSupabaseNfc } from "@/lib/travel-data/supabase";
import { getLocalPlacePage, getLocalPlaceSlugs, getLocalTripBySlug, resolveLocalNfc } from "@/lib/travel-data/local";
import type { DataSource, NfcResolution, PlacePageData } from "@/lib/travel-data/types";

export type { DataSource, NfcResolution, PlacePageData } from "@/lib/travel-data/types";

export function getConfiguredDataSource(): DataSource {
  return process.env.TRAVEL_DATA_SOURCE === "supabase" ? "supabase" : "local";
}

function mayFallbackToLocal() {
  return process.env.TRAVEL_DATA_FALLBACK === "local" && process.env.NODE_ENV !== "production";
}

function reportSupabaseFallback(error: unknown) {
  const reason = error instanceof Error ? error.message : "error desconocido";
  console.warn(`Supabase no esta disponible; se usa la fuente local de desarrollo. ${reason}`);
}

export async function getTripBySlug(slug: string): Promise<Trip | undefined> {
  if (getConfiguredDataSource() === "local") return getLocalTripBySlug(slug);
  try {
    return await getSupabaseTripBySlug(slug);
  } catch (error) {
    if (!mayFallbackToLocal()) throw error;
    reportSupabaseFallback(error);
    return getLocalTripBySlug(slug);
  }
}

export async function getPlacePage(slug: string): Promise<PlacePageData | undefined> {
  if (getConfiguredDataSource() === "local") return getLocalPlacePage(slug);
  try {
    return await getSupabasePlacePage(slug);
  } catch (error) {
    if (!mayFallbackToLocal()) throw error;
    reportSupabaseFallback(error);
    return getLocalPlacePage(slug);
  }
}

export function getPlaceSlugs() {
  return getLocalPlaceSlugs();
}

export async function resolveNfcCode(code: string): Promise<NfcResolution | undefined> {
  if (getConfiguredDataSource() === "local") return resolveLocalNfc(code);
  try {
    return await resolveSupabaseNfc(code);
  } catch (error) {
    if (!mayFallbackToLocal()) throw error;
    reportSupabaseFallback(error);
    return resolveLocalNfc(code);
  }
}

export function getCoverVariant(trip: Trip, value?: string) {
  const normalized = value?.toLowerCase();
  const key: CoverVariant = normalized === "b" || normalized === "c" || normalized === "d" ? normalized : "a";
  return trip.coverVariants?.[key] ?? trip.cover;
}
