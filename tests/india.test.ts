import assert from "node:assert/strict";
import test from "node:test";
import { getIndiaCoverVariant, indiaTrip } from "../data/india";
import { buildIndiaSeed, indiaSeedSummary } from "../lib/supabase/india-seed";
import { getLocalPlacePage, getLocalTripBySlug, resolveLocalNfc } from "../lib/travel-data/local";

test("India tiene una historia real de nueve jornadas navegable", () => {
  assert.equal(indiaTrip.slug, "india");
  assert.equal(indiaTrip.dates, "2-10 septiembre 2018");
  assert.equal(indiaTrip.days.length, 9);
  assert.equal(indiaTrip.days[0].dayNumber, 0);
  assert.equal(indiaTrip.days[0].date, "2018-09-02");
  assert.equal(indiaTrip.days[0].title, "Salida y vuelo a India");
  assert.equal(indiaTrip.cover.mode, "collage");
  assert.equal(indiaTrip.cover.variant, "a");
  assert.ok(indiaTrip.cover.media.length >= 3);
  assert.equal(getIndiaCoverVariant("a").media.length, 3);
  assert.equal(getIndiaCoverVariant("b").media[0].orientation, "portrait");
  assert.equal(getIndiaCoverVariant("c").media.length, 4);
  assert.equal(getIndiaCoverVariant("d").video?.type, "video");
  assert.ok(indiaTrip.days.every((day) => day.placesVisited.length > 0));
  assert.ok(indiaTrip.days.every((day) => day.heroImage.type === "image"));
  assert.ok(indiaTrip.days.some((day) => day.video?.type === "video"));
  assert.ok(indiaTrip.days.some((day) => day.heroImage.orientation === "portrait"));
  assert.ok(indiaTrip.days.some((day) => day.heroImage.orientation === "landscape"));
  assert.ok(indiaTrip.days.some((day) => day.placeCandidates.some((candidate) => candidate.name === "Taj Mahal" && candidate.confidence === "high")));
  assert.ok(indiaTrip.gallery.length >= 40);
  assert.equal(indiaTrip.days.find((day) => day.date === "2018-09-08")?.placesVisited[0].name, "Taj Mahal");
  assert.deepEqual(indiaTrip.days.map((day) => day.title), [
    "Salida y vuelo a India",
    "Primer día en Delhi",
    "Sur de Delhi",
    "Camino a Jaipur",
    "Amber y Jaipur",
    "Camino a Agra",
    "Taj Mahal y Fuerte de Agra",
    "Hotel y piscina",
    "Regreso y aeropuerto",
  ]);
  assert.ok(indiaTrip.days.every((day) => day.placesVisited.every((place) => place.slug || place.name.toLowerCase().includes("vuelo") || place.name.includes("Aeropuerto"))));
});

test("la fuente local conserva el contrato de lectura del piloto", () => {
  assert.equal(getLocalTripBySlug("india")?.days.length, 9);
  assert.equal(getLocalPlacePage("taj-mahal")?.place.name, "Taj Mahal");
  assert.equal(getLocalPlacePage("taj-mahal")?.media.length, 4);
  assert.deepEqual(resolveLocalNfc("india-2018"), { tripSlug: "india", isActive: true });
});

test("el seed de India es determinista y no activa NFC", () => {
  const first = buildIndiaSeed();
  const second = buildIndiaSeed();
  assert.deepEqual(first, second);
  assert.deepEqual(indiaSeedSummary(first), {
    trips: 1,
    days: 9,
    places: 14,
    dayPlaceRelations: 14,
    photos: 40,
    videos: 6,
    mediaAssignments: 117,
    heroSets: 4,
    heroSetMedia: 13,
    nfcLinks: 1,
  });
  assert.equal(first.nfc_links[0].is_active, false);
});
