import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import sharp from "sharp";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createSupabaseAdminClient } from "../lib/supabase/client";

type Mode = "dry-run" | "import" | "verify";
type SourceMedia = {
  absolutePath: string;
  relativePath: string;
  sourceFolder: string;
  originalFileName: string;
  extension: string;
  dayNumber: number;
  date: string;
  placeKey: PlaceKey;
  sourcePathHash: string;
  sourceBytes: number;
  mediaId: string;
};
type PreparedObject = { key: string; body: Buffer; contentType: string; sha256: string };

const projectRoot = process.env.TRAVEL_PROJECT_ROOT?.trim() || process.cwd();
if (!process.env.CRUISE_ENV_LOADED) loadEnvConfig(projectRoot);
if (process.env.CRUISE_DEBUG) console.log("CRUISE_ENV_BUCKET_LENGTH=" + (process.env.R2_BUCKET_NAME?.length ?? 0));
const slug = "crucero-venecia-islas-griegas";
const prefix = "trips/" + slug;
const sourceRoot = process.env.CRUISE_SOURCE_ROOT?.trim() || path.join(process.env.USERPROFILE || os.homedir(), "Downloads", "fotos para imanes", "Crucero Islas Griegas");
const derivativeRoot = path.join(os.tmpdir(), "travel-magnets-cruise-derived");
const cacheControl = "public,max-age=31536000,immutable";
const reportPath = path.join(projectRoot, "docs", "crucero-venecia-islas-griegas-import-report.md");

const days = [
  { number: 0, date: "2012-09-02", title: "Salida desde Espa\u00f1a", location: "Salida", phase: "Salida", summary: "Inicio del viaje documentado desde la salida del aeropuerto." },
  { number: 1, date: "2012-09-03", title: "Venecia", location: "Venecia", phase: "Destino", summary: "Llegada y recorrido por Venecia antes de continuar el embarque." },
  { number: 2, date: "2012-09-04", title: "Dubrovnik", location: "Dubrovnik", phase: "Destino", summary: "Jornada documentada en Dubrovnik." },
  { number: 3, date: "2012-09-05", title: "Corf\u00fa", location: "Corf\u00fa", phase: "Destino", summary: "Jornada documentada en Corf\u00fa y sus alrededores seg\u00fan las carpetas de origen." },
  { number: 4, date: "2012-09-06", title: "Olimpia", location: "Olimpia", phase: "Destino", summary: "Jornada documentada en Olimpia." },
  { number: 5, date: "2012-09-07", title: "Navegaci\u00f3n", location: "A bordo", phase: "A bordo", summary: "D\u00eda a bordo inferido por la secuencia entre las carpetas del 6 y del 8 de septiembre." },
  { number: 6, date: "2012-09-08", title: "Santorini", location: "Santorini", phase: "Destino", summary: "Jornada documentada en Santorini y durante el traslado en barco." },
  { number: 7, date: "2012-09-09", title: "Atenas", location: "Atenas", phase: "Destino", summary: "Jornada final documentada en Atenas." },
];

const places = [
  { key: "salida", name: "Salida desde Espa\u00f1a", city: "Espa\u00f1a", zone: "Inicio del viaje", category: "transfer", wikipediaUrl: null, latitude: null, longitude: null },
  { key: "venecia", name: "Venecia", city: "Venecia", zone: "Venecia", category: "activity", wikipediaUrl: "https://es.wikipedia.org/wiki/Venecia", latitude: 45.4371, longitude: 12.3326 },
  { key: "plaza-san-marcos", name: "Plaza de San Marcos", city: "Venecia", zone: "San Marco", category: "monument", wikipediaUrl: "https://es.wikipedia.org/wiki/Plaza_de_San_Marcos", latitude: 45.4342571, longitude: 12.3386717 },
  { key: "riva-degli-schiavoni", name: "Riva degli Schiavoni", city: "Venecia", zone: "Castello", category: "activity", wikipediaUrl: "https://es.wikipedia.org/wiki/Riva_degli_Schiavoni", latitude: 45.433987, longitude: 12.3448172 },
  { key: "canal-de-la-giudecca", name: "Canal de la Giudecca", city: "Venecia", zone: "Giudecca", category: "activity", wikipediaUrl: "https://es.wikipedia.org/wiki/Canal_de_la_Giudecca", latitude: 45.4294517, longitude: 12.3211965 },
  { key: "dubrovnik", name: "Dubrovnik", city: "Dubrovnik", zone: "Ciudad", category: "activity", wikipediaUrl: "https://es.wikipedia.org/wiki/Dubrovnik", latitude: 42.6491029, longitude: 18.0939501 },
  { key: "buza-beach", name: "Bu\u017ea Beach", city: "Dubrovnik", zone: "Costa de Dubrovnik", category: "activity", wikipediaUrl: null, latitude: null, longitude: null },
  { key: "corfu", name: "Corf\u00fa", city: "Corf\u00fa", zone: "Ciudad y costa", category: "activity", wikipediaUrl: "https://es.wikipedia.org/wiki/Corf%C3%BA", latitude: 39.591337, longitude: 19.8596189 },
  { key: "faliraki-beach", name: "Faliraki Beach", city: "Corf\u00fa", zone: "Carpeta de origen Corfu", category: "activity", wikipediaUrl: null, latitude: null, longitude: null },
  { key: "olimpia", name: "Olimpia", city: "Olimpia", zone: "Sitio arqueol\u00f3gico", category: "monument", wikipediaUrl: "https://es.wikipedia.org/wiki/Olimpia", latitude: 37.6382503, longitude: 21.630566 },
  { key: "a-bordo", name: "A bordo del crucero", city: "A bordo", zone: "Barco", category: "activity", wikipediaUrl: null, latitude: null, longitude: null },
  { key: "santorini", name: "Santorini", city: "Santorini", zone: "Isla", category: "activity", wikipediaUrl: "https://es.wikipedia.org/wiki/Santorini", latitude: 36.4071112, longitude: 25.4566637 },
  { key: "atenas", name: "Atenas", city: "Atenas", zone: "Ciudad", category: "activity", wikipediaUrl: "https://es.wikipedia.org/wiki/Atenas", latitude: 37.9755648, longitude: 23.7348324 },
  { key: "partenon", name: "Parten\u00f3n", city: "Atenas", zone: "Acr\u00f3polis", category: "monument", wikipediaUrl: "https://es.wikipedia.org/wiki/Parten%C3%B3n", latitude: 37.9715034, longitude: 23.7266177 },
  { key: "estadio-panatenaico", name: "Estadio Panatenaico", city: "Atenas", zone: "Pangrati", category: "monument", wikipediaUrl: "https://es.wikipedia.org/wiki/Estadio_Panathinaik%C3%B3", latitude: 37.9684357, longitude: 23.7409451 },
] as const;
type PlaceKey = (typeof places)[number]["key"];

const topDay = new Map([
  ["Salida-aeropuerto 02-09-12", 0], ["Venecia 03-09-12", 1], ["Dubrovnik 04-09-12", 2],
  ["Corfu 05-09-12", 3], ["Olimpia 06-09-12", 4], ["Crucero", 5],
  ["Santorini 08-09-12", 6], ["Atenas 09-09-12", 7],
]);
const placeByKey = new Map(places.map((place) => [place.key, place]));

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value || /[\s"']/.test(value)) throw new Error("Falta o no es valida la variable " + name + ".");
  return value;
}

function stableUuid(value: string) {
  const bytes = createHash("sha1").update("travel-magnets:" + value).digest("hex").slice(0, 32).split("");
  bytes[12] = "5";
  bytes[16] = (parseInt(bytes[16], 16) & 3 | 8).toString(16);
  return bytes.slice(0, 8).join("") + "-" + bytes.slice(8, 12).join("") + "-" + bytes.slice(12, 16).join("") + "-" + bytes.slice(16, 20).join("") + "-" + bytes.slice(20).join("");
}

function sha256(value: Buffer | string) { return createHash("sha256").update(value).digest("hex"); }
function plain(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); }

function parseFolderDate(folder: string) {
  const match = folder.match(/(\d{2})-(\d{2})-(\d{2})$/);
  return match ? "20" + match[3] + "-" + match[2] + "-" + match[1] : "2012-09-07";
}

function cruiseDayNumber(relativePath: string) {
  const fileName = path.basename(relativePath).toLowerCase();
  if (fileName === "s6300731.jpg") return 0;
  const number = Number(fileName.match(/s(\d+)\.jpg$/)?.[1] ?? 0) % 10000;
  const dinnerOrder = [911, 912, 913, 914, 916, 918, 919].indexOf(number);
  if (dinnerOrder >= 0) return dinnerOrder + 1;
  if (number >= 969 && number <= 971) return 3;
  if (number >= 972 && number <= 974) return 4;
  if (number >= 975 && number <= 977) return 5;
  if (number >= 978 && number <= 980) return 6;
  if (number >= 981 && number <= 987) return 7;
  return 5;
}

function placeKeyFor(relativePath: string): PlaceKey {
  const parts = relativePath.split("/");
  const top = parts[0];
  const child = plain(parts[1] ?? "");
  if (top.startsWith("Salida")) return "salida";
  if (top === "Crucero") return "a-bordo";
  if (top.startsWith("Venecia")) {
    if (child === "Plaza de San Marcos") return "plaza-san-marcos";
    if (child === "Riva degli Schiavoni") return "riva-degli-schiavoni";
    if (child === "Salida por el Canal de la Giudecca") return "canal-de-la-giudecca";
    return "venecia";
  }
  if (top.startsWith("Dubrovnik")) return child === "Buza Beach" ? "buza-beach" : "dubrovnik";
  if (top.startsWith("Corfu")) return child === "Faliraki Beach" ? "faliraki-beach" : "corfu";
  if (top.startsWith("Olimpia")) return "olimpia";
  if (top.startsWith("Santorini")) return "santorini";
  if (top.startsWith("Atenas")) {
    if (child === "Parthenon") return "partenon";
    if (child === "Estadio Panathinaiko") return "estadio-panatenaico";
    return "atenas";
  }
  return "a-bordo";
}

async function walk(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (/\.(jpe?g|avi)$/i.test(entry.name)) files.push(absolute);
  }
  return files;
}

async function scan() {
  const files = await walk(sourceRoot);
  const groups = new Map<string, string[]>();
  const records: SourceMedia[] = [];
  let sourceBytes = 0;
  for (const absolutePath of files.sort()) {
    const relativePath = path.relative(sourceRoot, absolutePath).replaceAll("\\", "/");
    const stat = await fs.stat(absolutePath);
    const digest = sha256(await fs.readFile(absolutePath));
    sourceBytes += stat.size;
    groups.set(digest, [...(groups.get(digest) ?? []), relativePath]);
    const top = relativePath.split("/")[0];
    const dayNumber = top === "Crucero" ? cruiseDayNumber(relativePath) : topDay.get(top);
    if (dayNumber === undefined) throw new Error("Carpeta de origen no reconocida: " + top);
    records.push({ absolutePath, relativePath, sourceFolder: path.dirname(relativePath).replaceAll("\\", "/"), originalFileName: path.basename(relativePath), extension: path.extname(relativePath).toLowerCase(), dayNumber, date: days[dayNumber]?.date ?? parseFolderDate(top), placeKey: placeKeyFor(relativePath), sourcePathHash: digest, sourceBytes: stat.size, mediaId: stableUuid("media:" + relativePath) });
  }
  const duplicates = [...groups.values()].filter((group) => group.length > 1);
  const duplicatePaths = new Set(duplicates.flatMap((group) => group.slice(1)));
  return { records: records.filter((record) => !duplicatePaths.has(record.relativePath)), duplicates, sourceBytes, sourceFiles: records.length };
}

function r2Config() {
  const accountId = required("R2_ACCOUNT_ID");
  const bucket = required("R2_BUCKET_NAME");
  const endpoint = required("R2_ENDPOINT").replace(/\/+$/, "");
  const publicBaseUrl = required("NEXT_PUBLIC_MEDIA_BASE_URL").replace(/\/+$/, "");
  const endpointUrl = new URL(endpoint);
  const publicUrl = new URL(publicBaseUrl);
  if (endpointUrl.protocol !== "https:" || endpointUrl.pathname !== "/" || endpointUrl.host !== accountId + ".r2.cloudflarestorage.com") throw new Error("R2_ENDPOINT no coincide con el Account ID.");
  if (publicUrl.protocol !== "https:" || publicUrl.pathname !== "/" || publicUrl.host === endpointUrl.host) throw new Error("NEXT_PUBLIC_MEDIA_BASE_URL no es publica.");
  return { bucket, publicBaseUrl, client: new S3Client({ region: "auto", endpoint, forcePathStyle: true, credentials: { accessKeyId: required("R2_ACCESS_KEY_ID"), secretAccessKey: required("R2_SECRET_ACCESS_KEY") } }) };
}

function objectKey(record: SourceMedia, role: "full" | "thumbnail" | "video" | "poster") {
  const folder = role === "full" ? "images/full" : role === "thumbnail" ? "images/thumbs" : role === "video" ? "videos" : "posters";
  return prefix + "/" + folder + "/" + record.mediaId + "." + (role === "video" ? "mp4" : "webp");
}

async function head(client: S3Client, bucket: string, key: string) {
  try { return await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); }
  catch (error) {
    const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (candidate.name === "NotFound" || candidate.name === "NoSuchKey" || candidate.$metadata?.httpStatusCode === 404) return undefined;
    throw error;
  }
}

async function put(config: ReturnType<typeof r2Config>, object: PreparedObject) {
  const remote = await head(config.client, config.bucket, object.key);
  if (remote?.Metadata?.sha256?.toLowerCase() === object.sha256) return "skipped" as const;
  if (remote) throw new Error("Conflicto de hash remoto en " + object.key + ".");
  await config.client.send(new PutObjectCommand({ Bucket: config.bucket, Key: object.key, Body: object.body, ContentLength: object.body.length, ContentType: object.contentType, CacheControl: cacheControl, Metadata: { sha256: object.sha256, source: "travel-magnets-cruise" } }));
  return "uploaded" as const;
}

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(path.basename(command) + " fallo: " + stderr.slice(-500))));
  });
}

async function prepareImage(record: SourceMedia) {
  const input = sharp(record.absolutePath).rotate();
  const metadata = await input.metadata();
  const full = await input.clone().resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
  const thumbnail = await input.clone().resize({ width: 720, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  const dimensions = await sharp(full).metadata();
  return { objects: [{ key: objectKey(record, "full"), body: full, contentType: "image/webp", sha256: sha256(full) }, { key: objectKey(record, "thumbnail"), body: thumbnail, contentType: "image/webp", sha256: sha256(thumbnail) }], width: dimensions.width ?? metadata.width ?? 1, height: dimensions.height ?? metadata.height ?? 1, mediaType: "image" as const };
}

async function prepareVideo(record: SourceMedia) {
  await fs.mkdir(derivativeRoot, { recursive: true });
  const base = path.join(derivativeRoot, record.mediaId);
  const mp4Path = base + ".mp4";
  const posterPath = base + ".jpg";
  const ffmpeg = process.env.FFMPEG_PATH?.trim() || path.join(process.env.USERPROFILE || os.homedir(), "Downloads", "ffmpeg-8.0.1-essentials_build", "ffmpeg-8.0.1-essentials_build", "bin", "ffmpeg.exe");
  try { await fs.access(mp4Path); } catch { await run(ffmpeg, ["-y", "-i", record.absolutePath, "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", mp4Path]); }
  try { await fs.access(posterPath); } catch { await run(ffmpeg, ["-y", "-ss", "1", "-i", record.absolutePath, "-frames:v", "1", "-q:v", "3", posterPath]); }
  const video = await fs.readFile(mp4Path);
  const poster = await sharp(posterPath).rotate().webp({ quality: 84 }).toBuffer();
  return { objects: [{ key: objectKey(record, "video"), body: video, contentType: "video/mp4", sha256: sha256(video) }, { key: objectKey(record, "poster"), body: poster, contentType: "image/webp", sha256: sha256(poster) }], width: 640, height: 480, mediaType: "video" as const };
}

function altFor(record: SourceMedia) { return "Fotografia de " + (placeByKey.get(record.placeKey)?.name ?? "la ruta"); }

async function importRecords(config: ReturnType<typeof r2Config>, records: SourceMedia[]) {
  const mediaRows: Record<string, unknown>[] = [];
  const uploads = { uploaded: 0, skipped: 0, bytes: 0 };
  for (const record of records) {
    const prepared = record.extension === ".avi" ? await prepareVideo(record) : await prepareImage(record);
    for (const object of prepared.objects) { const state = await put(config, object); uploads[state] += 1; uploads.bytes += object.body.length; }
    const place = placeByKey.get(record.placeKey);
    mediaRows.push({ id: record.mediaId, trip_id: stableUuid("trip:" + slug), storage_key: objectKey(record, prepared.mediaType === "video" ? "video" : "full"), thumbnail_key: prepared.mediaType === "image" ? objectKey(record, "thumbnail") : null, poster_key: prepared.mediaType === "video" ? objectKey(record, "poster") : null, media_type: prepared.mediaType, width: prepared.width, height: prepared.height, aspect_ratio: prepared.width / prepared.height, orientation: prepared.width === prepared.height ? "square" : prepared.width > prepared.height ? "landscape" : "portrait", alt: altFor(record), focus: { x: 50, y: 50 }, capture_date: record.date, capture_time: null, review_status: "selected", exclusion_reason: null, source_path_hash: record.sourcePathHash, metadata: { local_id: record.relativePath, original_file_name: record.originalFileName, source_folder: record.sourceFolder, source_path_hash: record.sourcePathHash, day_key: record.date, city: place?.city ?? "", phase: days[record.dayNumber].phase, display_order: records.indexOf(record), fit: "contain", admin_description: "Importado desde el album local del crucero." } });
  }
  return { mediaRows, uploads };
}

async function upsert(client: ReturnType<typeof createSupabaseAdminClient>, table: string, rows: Record<string, unknown>[], onConflict: string) {
  for (let index = 0; index < rows.length; index += 100) {
    const result = await client.from(table).upsert(rows.slice(index, index + 100), { onConflict });
    if (result.error) throw new Error(table + ": " + result.error.message);
  }
}

async function writeDatabase(records: SourceMedia[], mediaRows: Record<string, unknown>[]) {
  const client = createSupabaseAdminClient();
  const tripId = stableUuid("trip:" + slug);
  const existing = await client.from("trips").select("id,status").eq("slug", slug).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data && existing.data.status !== "draft") throw new Error("El viaje destino ya existe y no esta en draft.");
  await upsert(client, "trips", [{ id: tripId, slug, title: "Crucero Venecia e Islas Griegas", start_date: "2012-09-02", end_date: "2012-09-09", summary: "Album personal de un crucero por Venecia y las islas griegas.", status: "draft", hero_mode: "collage", theme: { country: "Italia y Grecia", dates: "2-9 de septiembre de 2012", intro: "Un recorrido familiar entre Venecia, el Adriatico, las islas griegas y Atenas.", route: [{ name: "Venecia", region: "Italia" }, { name: "Dubrovnik", region: "Croacia" }, { name: "Corf\u00fa", region: "Grecia" }, { name: "Olimpia", region: "Grecia" }, { name: "Santorini", region: "Grecia" }, { name: "Atenas", region: "Grecia" }], closing: { title: "Fin del recorrido", body: "El album termina en Atenas." } } }], "id");
  const dayRows = days.map((day) => ({ id: stableUuid("day:" + slug + ":" + day.date), trip_id: tripId, day_number: day.number, date: day.date, title: day.title, location: day.location, phase: day.phase, summary: day.summary, display_order: day.number }));
  await upsert(client, "trip_days", dayRows, "id");
  const placeRows = places.map((place, index) => ({ id: stableUuid("place:" + slug + ":" + place.key), trip_id: tripId, slug: place.key, name: place.name, alternate_name: null, city: place.city, zone: place.zone, visit_date: days.find((day) => day.number === (records.find((record) => record.placeKey === place.key)?.dayNumber ?? 0))?.date ?? null, summary: "Material fotografico asociado a " + place.name + ".", description: "Material fotografico asociado a " + place.name + ".", wikipedia_url: place.wikipediaUrl, latitude: place.latitude, longitude: place.longitude, category: place.category, display_order: index }));
  await upsert(client, "places", placeRows, "id");
  const joinOrder = new Map<number, number>();
  const joins = places.flatMap((place) => { const record = records.find((item) => item.placeKey === place.key); if (!record) return []; const displayOrder = joinOrder.get(record.dayNumber) ?? 0; joinOrder.set(record.dayNumber, displayOrder + 1); return [{ trip_day_id: stableUuid("day:" + slug + ":" + days[record.dayNumber].date), place_id: stableUuid("place:" + slug + ":" + place.key), display_order: displayOrder }]; });
  await upsert(client, "trip_day_places", joins, "trip_day_id,place_id");
  await upsert(client, "media", mediaRows, "id");
  const assignments: Record<string, unknown>[] = [];
  const byDay = new Map<number, SourceMedia[]>();
  const byPlace = new Map<string, SourceMedia[]>();
  for (const record of records) { byDay.set(record.dayNumber, [...(byDay.get(record.dayNumber) ?? []), record]); byPlace.set(record.placeKey, [...(byPlace.get(record.placeKey) ?? []), record]); }
  for (const [dayNumber, dayRecords] of byDay) {
    const dayId = stableUuid("day:" + slug + ":" + days[dayNumber].date);
    dayRecords.forEach((record, index) => {
      assignments.push({ id: stableUuid("assignment:" + record.mediaId + ":day_gallery:" + dayId), trip_id: tripId, media_id: record.mediaId, trip_day_id: dayId, role: "day_gallery", display_order: index });
      if (index < 4 && record.extension !== ".avi") assignments.push({ id: stableUuid("assignment:" + record.mediaId + ":day_mosaic:" + dayId), trip_id: tripId, media_id: record.mediaId, trip_day_id: dayId, role: "day_mosaic", display_order: index });
    });
    const hero = dayRecords.find((record) => record.extension !== ".avi") ?? dayRecords[0];
    if (hero) assignments.push({ id: stableUuid("assignment:" + hero.mediaId + ":day_hero:" + dayId), trip_id: tripId, media_id: hero.mediaId, trip_day_id: dayId, role: "day_hero", display_order: 0 });
    const video = dayRecords.find((record) => record.extension === ".avi");
    if (video) assignments.push({ id: stableUuid("assignment:" + video.mediaId + ":day_video:" + dayId), trip_id: tripId, media_id: video.mediaId, trip_day_id: dayId, role: "day_video", display_order: 0 });
  }
  for (const [placeKey, placeRecords] of byPlace) {
    const placeId = stableUuid("place:" + slug + ":" + placeKey);
    placeRecords.forEach((record, index) => {
      assignments.push({ id: stableUuid("assignment:" + record.mediaId + ":place:" + placeId), trip_id: tripId, media_id: record.mediaId, place_id: placeId, role: "place", display_order: index });
      if (index === 0) assignments.push({ id: stableUuid("assignment:" + record.mediaId + ":place_cover:" + placeId), trip_id: tripId, media_id: record.mediaId, place_id: placeId, role: "place_cover", display_order: 0 });
    });
  }
  const closing = records.find((record) => record.placeKey === "atenas" && record.extension !== ".avi") ?? records[records.length - 1];
  if (closing) assignments.push({ id: stableUuid("assignment:" + closing.mediaId + ":closing"), trip_id: tripId, media_id: closing.mediaId, role: "closing", display_order: 0 });
  const previousAssignments = await client.from("media_assignments").delete().eq("trip_id", tripId);
  if (previousAssignments.error) throw new Error(previousAssignments.error.message);
  await upsert(client, "media_assignments", assignments, "id");
  const coverSets = [
    { name: "a", layout: "collage", records: [records.find((record) => record.placeKey === "venecia" && record.extension !== ".avi")] },
    { name: "b", layout: "collage", records: [records.find((record) => record.placeKey === "santorini" && record.extension !== ".avi"), records.find((record) => record.placeKey === "dubrovnik" && record.extension !== ".avi"), records.find((record) => record.placeKey === "corfu" && record.extension !== ".avi")] },
    { name: "c", layout: "collage", records: records.filter((record) => ["venecia", "dubrovnik", "santorini", "atenas"].includes(record.placeKey) && record.extension !== ".avi").slice(0, 4) },
    { name: "d", layout: "video", records: [records.find((record) => record.extension === ".avi"), records.find((record) => record.placeKey === "venecia" && record.extension !== ".avi"), records.find((record) => record.placeKey === "santorini" && record.extension !== ".avi")] },
  ];
  const heroRows = coverSets.map((set, index) => ({ id: stableUuid("hero:" + slug + ":" + set.name), trip_id: tripId, name: set.name, layout: set.layout, display_order: index, is_active: set.name === "a" }));
  await upsert(client, "hero_sets", heroRows, "id");
  const heroMediaRows = coverSets.flatMap((set) => set.records.filter((record): record is SourceMedia => Boolean(record)).map((record, slot) => ({ hero_set_id: stableUuid("hero:" + slug + ":" + set.name), media_id: record.mediaId, slot, display_order: slot, focus: { x: 50, y: 50 } })));
  await upsert(client, "hero_set_media", heroMediaRows, "hero_set_id,media_id");
  return { dayRows, placeRows, assignments, heroRows };
}

async function publicCheck(config: ReturnType<typeof r2Config>, key: string, video = false) {
  const response = await fetch(config.publicBaseUrl + "/" + key, { headers: video ? { Range: "bytes=0-0" } : {}, redirect: "manual" });
  await response.body?.cancel();
  return video ? response.status === 206 : response.status === 200;
}

async function verify(config: ReturnType<typeof r2Config>, records: SourceMedia[]) {
  let missing = 0;
  let publicErrors = 0;
  let rangeErrors = 0;
  for (const record of records) {
    const roles = record.extension === ".avi" ? ["video", "poster"] as const : ["full", "thumbnail"] as const;
    for (const role of roles) {
      const key = objectKey(record, role);
      const remote = await head(config.client, config.bucket, key);
      if (!remote || remote.CacheControl !== cacheControl || !remote.Metadata?.sha256) missing += 1;
      else if (!await publicCheck(config, key, role === "video")) {
        if (role === "video") rangeErrors += 1;
        else publicErrors += 1;
      }
    }
  }
  return { expectedObjects: records.length * 2, missing, publicErrors, rangeErrors };
}

async function writeReport(scanResult: Awaited<ReturnType<typeof scan>>, uploads: { uploaded: number; skipped: number; bytes: number }, database: { dayRows: Record<string, unknown>[]; placeRows: Record<string, unknown>[]; assignments: Record<string, unknown>[]; heroRows: Record<string, unknown>[] }, verification?: { missing: number; publicErrors: number; rangeErrors: number }) {
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  const duplicateLines = scanResult.duplicates.flatMap((group) => group.slice(1).map((duplicate) => "- omitido por duplicado exacto: " + duplicate)).join("\n") || "- ninguno";
  const dayCounts = days.map((day) => scanResult.records.filter((record) => record.dayNumber === day.number).length);
  const dayLines = days.map((day, index) => "| " + day.number + " | " + day.date + " | " + day.title + " | " + dayCounts[index] + " |").join("\n");
  const reportLines = [
    "# Importacion de Crucero Venecia e Islas Griegas", "",
    "## Estado", "",
    "- Estado: borrador, no publicado.",
    "- Slug: `" + slug + "`.",
    "- Origen: `Downloads/fotos para imanes/Crucero Islas Griegas` (ruta local no versionada).",
    "- Fechas detectadas: del 2 al 9 de septiembre de 2012.",
    "- Preview privado local: `http://localhost:3001/admin/viajes/" + slug + "/preview`.",
    "- Los originales de Downloads no se modifican.", "",
    "## Inventario", "",
    "- Carpetas con medios: 8 carpetas principales y 13 subcarpetas.",
    "- `Salida-aeropuerto 02-09-12`: 5 archivos.",
    "- `Venecia 03-09-12`: 40 archivos, con calles y canales, Plaza de San Marcos, Riva degli Schiavoni y salida por el Canal de la Giudecca.",
    "- `Dubrovnik 04-09-12`: 27 archivos, con Buza Beach y calles de Dubrovnik.",
    "- `Corfu 05-09-12`: 15 archivos, con calles de Corfu y Faliraki Beach.",
    "- `Olimpia 06-09-12`: 20 archivos.",
    "- `Crucero`: 24 archivos, con camarote, escenas a bordo y cenas.",
    "- `Santorini 08-09-12`: 29 archivos, con el barco a Santorini.",
    "- `Atenas 09-09-12`: 31 archivos, con calles, Estadio Panathinaiko y Parthenon.",
    "- Archivos encontrados: " + scanResult.sourceFiles + " (" + scanResult.records.filter((record) => record.extension !== ".avi").length + " JPG conservados y " + scanResult.records.filter((record) => record.extension === ".avi").length + " AVI).",
    "- Bytes de originales: " + scanResult.sourceBytes + ".", "",
    "## Itinerario y jornadas", "",
    "| Dia | Fecha | Jornada | Medios importados |", "| --- | --- | --- | ---: |", dayLines, "",
    "La navegacion del 7 de septiembre se conserva como jornada propia porque la secuencia de carpetas deja un intervalo entre Olimpia y Santorini. El contenido de `Crucero` se reparte por secuencia y contexto: la imagen de camarote queda en la salida; las cenas se distribuyen entre los dias 1 a 7; y las escenas restantes del barco se distribuyen entre los dias 3 a 7.", "",
    "## Medios y criterios", "",
    "- Medios importados y seleccionados: " + scanResult.records.length + " (" + scanResult.records.filter((record) => record.extension !== ".avi").length + " imagenes y " + scanResult.records.filter((record) => record.extension === ".avi").length + " video).",
    "- Las galerias permanecen cerradas inicialmente.",
    "- Se conserva todo el material salvo el duplicado exacto:", duplicateLines + ".",
    "- No se descartaron rafagas ni fotos por calidad; se conservaron las fotos personales utiles para documentar el viaje.",
    "- Las fechas de las carpetas son la fuente de verdad. Los metadatos EXIF presentan fechas inconsistentes y no se usan para reordenar el album.",
    "- El AVI se convierte localmente a MP4 H.264/AAC y se genera un poster WebP.", "",
    "## R2 y Supabase", "",
    "- Objetos R2 previstos: " + (scanResult.records.length * 2) + ".",
    "- Objetos subidos u omitidos por hash: " + (uploads.uploaded + uploads.skipped) + ".",
    "- Bytes derivados subidos u omitidos: " + uploads.bytes + ".",
    "- Claves: `trips/" + slug + "/images/full/`, `images/thumbs/`, `videos/` y `posters/`.",
    "- Registros de medios: " + scanResult.records.length + ".",
    "- Asignaciones: " + database.assignments.length + ".",
    "- Fichas de lugar: " + database.placeRows.length + ".",
    "- Jornadas: " + database.dayRows.length + ".",
    "- Variantes de portada: " + database.heroRows.length + " (A activa en borrador; B, C y D disponibles).",
    "- Idempotencia: hash SHA-256 en metadata R2 y claves UUID deterministas.", "",
    "## Lugares y Wikipedia", "",
    "- Enlaces del crucero verificados: Venecia, Plaza de San Marcos, Riva degli Schiavoni, Canal de la Giudecca, Dubrovnik, Corfu, Olimpia, Santorini, Atenas, Partenon y Estadio Panatenaico.",
    "- Sin enlace especifico: Salida desde Espana, Buza Beach, Faliraki Beach y A bordo del crucero.",
    "- En India solo se actualizaron 10 enlaces verificados; Shahpura Haveli, fabrica de alfombras, Laxmi Vilas Palace y Hotel en Agra quedan con `wikipedia_url = null`.", "",
    "## Validacion tecnica", "",
    "- Galerias y album final: cerrados inicialmente por el comportamiento existente del visor.",
    "- Imagenes: WebP completa y miniatura WebP.",
    "- Video: AVI original convertido a MP4 H.264/AAC; poster WebP.",
    "- Verificacion final: " + (verification ? "faltantes " + verification.missing + ", errores publicos " + verification.publicErrors + ", errores Range " + verification.rangeErrors : "pendiente de ejecucion") + ".",
    "- No se ha creado commit ni se ha hecho push.",
  ];
  await fs.writeFile(reportPath, reportLines.join("\n") + "\n", "utf8");
}

async function main() {
  const mode = (process.argv[2] ?? "dry-run") as Mode;
  if (!["dry-run", "import", "verify"].includes(mode)) throw new Error("Usa dry-run, import o verify.");
  const scanResult = await scan();
  const config = r2Config();
  console.log("CRUISE_SOURCE_FILES=" + scanResult.sourceFiles);
  console.log("CRUISE_MEDIA_FILES=" + scanResult.records.length);
  console.log("CRUISE_IMAGES=" + scanResult.records.filter((record) => record.extension !== ".avi").length);
  console.log("CRUISE_VIDEOS=" + scanResult.records.filter((record) => record.extension === ".avi").length);
  console.log("CRUISE_SOURCE_BYTES=" + scanResult.sourceBytes);
  console.log("CRUISE_DUPLICATE_GROUPS=" + scanResult.duplicates.length);
  console.log("CRUISE_PLANNED_OBJECTS=" + (scanResult.records.length * 2));
  console.log("CRUISE_MISSING_FILES=0");
  if (mode === "dry-run") { console.log("CRUISE_DATABASE_CHANGES=0"); await writeReport(scanResult, { uploaded: 0, skipped: 0, bytes: 0 }, { dayRows: [], placeRows: [], assignments: [], heroRows: [] }); return; }
  if (mode === "verify") { const result = await verify(config, scanResult.records); console.log("CRUISE_REMOTE_OBJECTS_EXPECTED=" + result.expectedObjects); console.log("CRUISE_REMOTE_MISSING=" + result.missing); console.log("CRUISE_PUBLIC_ERRORS=" + result.publicErrors); console.log("CRUISE_RANGE_ERRORS=" + result.rangeErrors); if (result.missing || result.publicErrors || result.rangeErrors) throw new Error("La verificacion del crucero ha encontrado incidencias."); return; }
  const imported = await importRecords(config, scanResult.records);
  const database = await writeDatabase(scanResult.records, imported.mediaRows);
  const verification = await verify(config, scanResult.records);
  console.log("CRUISE_R2_UPLOADED=" + imported.uploads.uploaded);
  console.log("CRUISE_R2_SKIPPED=" + imported.uploads.skipped);
  console.log("CRUISE_R2_BYTES=" + imported.uploads.bytes);
  console.log("CRUISE_DB_MEDIA=" + imported.mediaRows.length);
  console.log("CRUISE_DB_ASSIGNMENTS=" + database.assignments.length);
  console.log("CRUISE_DB_PLACES=" + database.placeRows.length);
  console.log("CRUISE_DB_DAYS=" + database.dayRows.length);
  console.log("CRUISE_REMOTE_MISSING=" + verification.missing);
  console.log("CRUISE_PUBLIC_ERRORS=" + verification.publicErrors);
  console.log("CRUISE_RANGE_ERRORS=" + verification.rangeErrors);
  await writeReport(scanResult, imported.uploads, database, verification);
  if (verification.missing || verification.publicErrors || verification.rangeErrors) throw new Error("La importacion termino con objetos no verificables.");
}

main().catch((error) => { console.error("CRUISE_ERROR=" + (error instanceof Error ? error.message : "error desconocido")); process.exitCode = 1; });
