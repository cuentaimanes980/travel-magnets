import type { MediaItem, Trip, TripDay, TripPlace } from "@/types/travel";

export type DataSource = "local" | "supabase";

export type NfcResolution = {
  tripSlug: string;
  isActive: boolean;
};

export type PlacePageData = {
  place: TripPlace;
  media: MediaItem[];
  day?: TripDay;
  previousPlace?: TripPlace;
  nextPlace?: TripPlace;
  trip: Trip;
};
