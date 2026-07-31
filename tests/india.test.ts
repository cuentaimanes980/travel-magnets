import assert from "node:assert/strict";
import test from "node:test";
import { getIndiaCoverVariant, indiaTrip } from "../data/india";

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
